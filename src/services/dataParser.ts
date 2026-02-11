/**
 * Data Parser Service
 * Normalizes raw sheet data into typed interfaces
 * Single source of truth for all data transformation
 */

import {
  GULLINBURSTI_COLUMNS,
  VOYAGE_AWARDS_COLUMNS,
  ROLE_COIN_COLUMNS,
  canHost,
  mustSail,
} from '../config/SheetColumns';

// ==================== INTERFACES ====================

export interface ParsedCrewMember {
  // Identity
  rank: string;
  name: string;
  discordUsername: string;
  discordId: string;
  squad: string;
  timezone: string;
  
  // Guild & Game
  inGuild: boolean;
  xboxGamertag?: string;
  
  // Status
  loaStatus: boolean;
  loaReturnDate?: string;
  complianceStatus: string; // Raw LOA status value for display (e.g., "Active Duty", "LOA-1", etc.)
  
  // Activity & Compliance
  chatActivity: number; // 0-5 stars
  sailingCompliant: boolean; // Within 1 voyage/month
  hostingCompliant: boolean; // Within 1 host/fortnight (if applicable)
  canHostRank: boolean; // Rank allows hosting (JPO+)
  mustSailRank: boolean; // Rank requires sailing
  
  // Leadership & Dates
  squadLeaderComments?: string;
  cosNotes?: string;
  birthday?: string; // MM/DD format only
  
  // Service & Promotion
  spd?: string; // Special Project Division
  spdName?: string;
  serviceStripe?: boolean;
  serviceStripeCorrect?: boolean;
  promotionEligible?: boolean;
}

export interface ParsedLeaderboardEntry {
  name: string;
  rank: string;
  role?: string;
  joinDate: string;
  lastVoyageDate: string;
  lastHostDate: string;
  voyageCount: number;
  hostCount: number;
  daysInactive: number;
  timezone: string;
  inGuild: boolean;
}

export interface ParsedSubclassProgress {
  name: string;
  totalVoyages: number;
  carpenter: number;
  flex: number;
  cannoneer: number;
  helm: number;
  grenadierPoints: number;
  fieldSurgeonPoints: number;
  isPirateLegend: boolean;
  hasCommanderCoin: boolean;
  hasOfficerCoin: boolean;
}

export interface ParsedAwardStatus {
  name: string;
  awardsByColumn: Record<string, string>; // Column header -> award status
}

export interface GeneratedAction {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  sailor: string;
  squad: string;
  responsible: string;
  description: string;
  details: string;
  source: 'comment' | 'compliance' | 'activity'; // Where the action came from
  deadline?: string; // Optional deadline extracted from comment
}

// ==================== PARSER FUNCTIONS ====================

/**
 * Parse a single crew member from Gullinbursti sheet
 */
export const parseCrewMember = (row: Record<string, string>): ParsedCrewMember => {
  // Helper to get value - try numeric index first, then fuzzy header match
  const getRowValue = (numIndex: number, ...headerNames: string[]): string => {
    // Try numeric index first (won't work with header-keyed objects, but kept for compat)
    if (row[numIndex] !== undefined) {
      return row[numIndex] || '';
    }
    // Try exact header names
    for (const headerName of headerNames) {
      if (row[headerName] !== undefined) {
        return row[headerName] || '';
      }
    }
    // Try fuzzy match - find any key that contains any of the search terms
    const rowKeys = Object.keys(row);
    for (const headerName of headerNames) {
      const searchLower = headerName.toLowerCase().replace(/[_\s]/g, '');
      for (const key of rowKeys) {
        const keyLower = key.toLowerCase().replace(/[_\s]/g, '');
        if (keyLower === searchLower || keyLower.includes(searchLower) || searchLower.includes(keyLower)) {
          return row[key] || '';
        }
      }
    }
    return '';
  };

  // Also provide a way to get value by column index from the headers
  // This maps numeric indices to actual header-keyed values
  const getByIndex = (index: number): string => {
    const keys = Object.keys(row);
    if (index < keys.length) {
      return row[keys[index]] || '';
    }
    return '';
  };

  const rank = (getRowValue(GULLINBURSTI_COLUMNS.RANK, 'Rank', 'RANK', 'rank') || getByIndex(0)).trim();
  const name = (getRowValue(GULLINBURSTI_COLUMNS.NAME, 'Name', 'NAME', 'name') || getByIndex(1)).trim();

  // Extract compliance booleans
  const sailingRaw = (getRowValue(GULLINBURSTI_COLUMNS.SAILING_COMPLIANCE, 'Sailing Compliance', 'SAILING_COMPLIANCE', 'Sailing') || getByIndex(11)).trim();
  const sailingCompliant = sailingRaw.toLowerCase().includes('yes') || sailingRaw.toLowerCase().includes('within') || sailingRaw === '✓' || sailingRaw === '✔';
  
  const hostingRaw = (getRowValue(GULLINBURSTI_COLUMNS.HOSTING_COMPLIANCE, 'Hosting Compliance', 'HOSTING_COMPLIANCE', 'Hosting') || getByIndex(12)).trim();
  const hostingCompliant = hostingRaw.toLowerCase().includes('yes') || hostingRaw.toLowerCase().includes('within') || hostingRaw === '✓' || hostingRaw === '✔' || hostingRaw.toLowerCase() === 'n/a';

  // Parse chat activity (could be stars ★, number, or text)
  let chatActivity = 0;
  const activityRaw = (getRowValue(GULLINBURSTI_COLUMNS.CHAT_ACTIVITY, 'Chat Activity', 'CHAT_ACTIVITY', 'Chat', 'Activity', 'Stars') || getByIndex(10)).trim();
  if (activityRaw) {
    // Count star characters (★ or *)
    const starCount = (activityRaw.match(/[★⭐*]/g) || []).length;
    if (starCount > 0) {
      chatActivity = starCount;
    } else {
      // Try to parse as a number
      const numMatch = activityRaw.match(/\d+/);
      if (numMatch) {
        chatActivity = Math.min(parseInt(numMatch[0], 10), 5);
      }
    }
  }

  // Extract birthday (MM/DD only, no year)
  const birthday = (getRowValue(GULLINBURSTI_COLUMNS.BIRTHDAY, 'Birthday', 'BIRTHDAY') || getByIndex(14)).trim();

  // Get LOA status from LOA_STATUS column (column 8) - this is their leave status, NOT compliance
  const loaStatusRaw = (getRowValue(GULLINBURSTI_COLUMNS.LOA_STATUS, 'LOA Status', 'LOA_STATUS', 'LOA') || getByIndex(8)).trim();
  const complianceStatus = loaStatusRaw || 'Active Duty';

  return {
    rank,
    name,
    discordUsername: (getRowValue(GULLINBURSTI_COLUMNS.DISCORD_USERNAME, 'Discord Username', 'DISCORD_USERNAME', 'Discord') || getByIndex(2)).trim(),
    discordId: (getRowValue(GULLINBURSTI_COLUMNS.DISCORD_ID, 'Discord ID', 'DISCORD_ID') || getByIndex(16)).trim(),
    squad: 'Unassigned', // Will be overridden by parseAllCrewMembers
    timezone: (getRowValue(GULLINBURSTI_COLUMNS.TIMEZONE, 'Timezone', 'TIMEZONE', 'TZ') || getByIndex(7)).trim() || 'Unknown',
    inGuild: (getRowValue(GULLINBURSTI_COLUMNS.IN_GUILD_INDICATOR, 'In Guild', 'IN_GUILD_INDICATOR') || getByIndex(3)).toLowerCase().includes('yes'),
    xboxGamertag: (getRowValue(GULLINBURSTI_COLUMNS.GAMERTAG_XBOX, 'Xbox Gamertag', 'GAMERTAG_XBOX') || getByIndex(5)).trim() || undefined,
    loaStatus: loaStatusRaw.toLowerCase().includes('loa'),
    loaReturnDate: (getRowValue(GULLINBURSTI_COLUMNS.LOA_RETURN_DATE, 'LOA Return Date', 'LOA_RETURN_DATE') || getByIndex(9)).trim() || undefined,
    complianceStatus,
    chatActivity,
    sailingCompliant,
    hostingCompliant,
    canHostRank: canHost(rank),
    mustSailRank: mustSail(rank),
    squadLeaderComments: (getRowValue(GULLINBURSTI_COLUMNS.SQUAD_LEADER_COMMENTS, 'Squad Leader Comments', 'SQUAD_LEADER_COMMENTS', 'SL Comments') || getByIndex(13)).trim() || undefined,
    cosNotes: (getRowValue(GULLINBURSTI_COLUMNS.COS_NOTES, 'COS Notes', 'COS_NOTES') || getByIndex(22)).trim() || undefined,
    birthday: birthday || undefined,
    spd: (getRowValue(GULLINBURSTI_COLUMNS.SPD_INDICATOR, 'SPD Indicator', 'SPD_INDICATOR') || getByIndex(17)).toLowerCase().includes('yes') ? 'Yes' : undefined,
    spdName: (getRowValue(GULLINBURSTI_COLUMNS.SPD_NAME, 'SPD Name', 'SPD_NAME') || getByIndex(18)).trim() || undefined,
    serviceStripe: (getRowValue(GULLINBURSTI_COLUMNS.SERVICE_STRIPE, 'Service Stripe', 'SERVICE_STRIPE') || getByIndex(19)).toLowerCase().includes('yes'),
    serviceStripeCorrect: (getRowValue(GULLINBURSTI_COLUMNS.SERVICE_STRIPE_CORRECT, 'Service Stripe Correct', 'SERVICE_STRIPE_CORRECT') || getByIndex(20)).toLowerCase().includes('yes'),
    promotionEligible: (getRowValue(GULLINBURSTI_COLUMNS.PROMOTION_ELIGIBLE, 'Promotion Eligible', 'PROMOTION_ELIGIBLE') || getByIndex(21)).toLowerCase().includes('yes'),
  };
};

/**
 * Determine if a rank is command-level (should be in Command Staff)
 */
const isCommandRank = (rank: string): boolean => {
  const r = rank.toLowerCase();
  return r.includes('commander') || 
         r.includes('midship') || 
         r.includes('scpo') || 
         r.includes('senior chief') ||
         r.includes('captain') ||
         r.includes('admiral') ||
         r.includes('commodore');
};

/**
 * Parse all crew members from Gullinbursti sheet
 * Handles squad headers (rows with rank but no name) to track squad assignments
 */
export const parseAllCrewMembers = (rows: Record<string, string>[]): ParsedCrewMember[] => {
  const result: ParsedCrewMember[] = [];
  let currentSquad = 'Unassigned';

  for (const row of rows) {
    // Get values by either numeric index, header name, or positional index
    const rowKeys = Object.keys(row);
    const getByIndex = (index: number): string => {
      if (index < rowKeys.length) {
        return (row[rowKeys[index]] || '').trim();
      }
      return '';
    };
    
    const getRowValue = (numIndex: number, ...headerNames: string[]): string => {
      // Try numeric index first
      if (row[numIndex] !== undefined) {
        return (row[numIndex] || '').trim();
      }
      // Try exact header names
      for (const headerName of headerNames) {
        if (row[headerName] !== undefined) {
          return (row[headerName] || '').trim();
        }
      }
      // Try fuzzy match
      for (const headerName of headerNames) {
        const searchLower = headerName.toLowerCase().replace(/[_\s]/g, '');
        for (const key of rowKeys) {
          const keyLower = key.toLowerCase().replace(/[_\s]/g, '');
          if (keyLower === searchLower || keyLower.includes(searchLower) || searchLower.includes(keyLower)) {
            return (row[key] || '').trim();
          }
        }
      }
      // Fall back to positional index
      return getByIndex(numIndex);
    };

    const rank = getRowValue(GULLINBURSTI_COLUMNS.RANK, 'Rank', 'RANK', 'rank');
    const name = getRowValue(GULLINBURSTI_COLUMNS.NAME, 'Name', 'NAME', 'name');
    
    // Skip completely empty rows
    if (!rank && !name) continue;
    
    // Skip column header rows (Rank/Name header row)
    if (rank.toLowerCase() === 'rank' && name.toLowerCase() === 'name') continue;
    
    // Squad header row: rank has value but name is empty
    if (rank && !name) {
      currentSquad = rank;
      continue;
    }
    
    // Crew member row: both rank and name have values
    if (rank && name) {
      const crewMember = parseCrewMember(row);
      // Override the squad with the one we tracked
      // If still "Unassigned", check if this is a command-level rank
      if (currentSquad === 'Unassigned' && isCommandRank(rank)) {
        crewMember.squad = 'Command Staff';
      } else {
        crewMember.squad = currentSquad;
      }
      result.push(crewMember);
    }
  }

  return result;
};

/**
 * Parse leaderboard entry from Time/Voyage Awards sheet
 * Uses fuzzy header matching since rows are keyed by header names from Google Sheets
 */
export const parseLeaderboardEntry = (row: Record<string, string>): ParsedLeaderboardEntry => {
  const rowKeys = Object.keys(row);

  // Log headers once for debugging
  if (!(parseLeaderboardEntry as any)._logged) {
    console.log('[Voyage Awards] Row keys:', rowKeys);
    console.log('[Voyage Awards] Sample row values:', rowKeys.map(k => `${k}=${row[k]}`).join(' | '));
    (parseLeaderboardEntry as any)._logged = true;
  }

  // Fuzzy header matcher — same approach as parseCrewMember
  // For count/number fields, validates the result is numeric and falls back to positional if not
  const getVal = (numIndex: number, ...headerNames: string[]): string => {
    // Try numeric index (for array-indexed rows)
    if (row[numIndex] !== undefined) return (row[numIndex] || '').trim();
    // Try exact header names (case-sensitive)
    for (const h of headerNames) {
      if (row[h] !== undefined) return (row[h] || '').trim();
    }
    // Try case-insensitive exact match first (before fuzzy)
    for (const h of headerNames) {
      const hLower = h.toLowerCase();
      for (const key of rowKeys) {
        if (key.toLowerCase() === hLower) {
          return (row[key] || '').trim();
        }
      }
    }
    // Fuzzy match — but require minimum 4 char overlap to avoid false positives
    for (const h of headerNames) {
      const search = h.toLowerCase().replace(/[_\s]/g, '');
      if (search.length < 3) continue; // skip tiny search terms
      for (const key of rowKeys) {
        const keyNorm = key.toLowerCase().replace(/[_\s]/g, '');
        if (keyNorm === search) return (row[key] || '').trim();
        // Only match if the shorter string is at least 4 chars to avoid false positives
        if (keyNorm.length >= 4 && search.length >= 4) {
          if (keyNorm.includes(search) || search.includes(keyNorm)) {
            return (row[key] || '').trim();
          }
        }
      }
    }
    // Positional fallback
    if (numIndex < rowKeys.length) return (row[rowKeys[numIndex]] || '').trim();
    return '';
  };

  // For numeric fields, try header match first, but if result isn't a number, use positional fallback
  const getNumVal = (numIndex: number, ...headerNames: string[]): number => {
    const headerResult = getVal(numIndex, ...headerNames);
    const parsed = parseInt(headerResult || '0', 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    // If header match gave non-numeric, try positional directly
    if (numIndex < rowKeys.length) {
      const positional = (row[rowKeys[numIndex]] || '').trim();
      const posParsed = parseInt(positional || '0', 10);
      if (!isNaN(posParsed)) return posParsed;
    }
    return 0;
  };

  const voyageCount = getNumVal(VOYAGE_AWARDS_COLUMNS.TOTAL_VOYAGES, 'Total Voyages', 'TOTAL_VOYAGES', 'Voyages', 'Official Voyages', 'Voyages Attended', 'Total Official Voyages', '# Voyages');
  const hostCount = getNumVal(VOYAGE_AWARDS_COLUMNS.HOST_COUNT, 'Host Count', 'HOST_COUNT', 'Hosts', 'Times Hosted', 'Hosted', '# Hosts');
  const daysInactive = getNumVal(VOYAGE_AWARDS_COLUMNS.DAYS_INACTIVE, 'Days Inactive', 'DAYS_INACTIVE', 'Inactive', 'Days Since Last Voyage');

  return {
    name: getVal(VOYAGE_AWARDS_COLUMNS.NAME, 'Name', 'NAME', 'Sailor').replace(/\[.*?\]\s*/g, '').trim(),
    rank: getVal(VOYAGE_AWARDS_COLUMNS.RANK, 'Rank', 'RANK'),
    role: getVal(VOYAGE_AWARDS_COLUMNS.ROLE, 'Role', 'ROLE'),
    joinDate: getVal(VOYAGE_AWARDS_COLUMNS.JOIN_DATE, 'Join Date', 'JOIN_DATE', 'Joined'),
    lastVoyageDate: getVal(VOYAGE_AWARDS_COLUMNS.LAST_VOYAGE_DATE, 'Last Voyage Date', 'LAST_VOYAGE_DATE', 'Last Voyage', 'Last Official Voyage'),
    lastHostDate: getVal(VOYAGE_AWARDS_COLUMNS.LAST_HOST_DATE, 'Last Host Date', 'LAST_HOST_DATE', 'Last Host', 'Last Hosted'),
    voyageCount,
    hostCount,
    daysInactive,
    timezone: getVal(VOYAGE_AWARDS_COLUMNS.TIMEZONE, 'Timezone', 'TIMEZONE', 'TZ'),
    inGuild: getVal(VOYAGE_AWARDS_COLUMNS.IN_GUILD, 'In Guild', 'IN_GUILD').toLowerCase().includes('yes'),
  };
};

/**
 * Parse all leaderboard entries
 * Filters out header rows and entries without a name
 */
export const parseAllLeaderboardEntries = (rows: Record<string, string>[]): ParsedLeaderboardEntry[] => {
  const parsed = rows
    .filter((row) => {
      // Try to find name by any method
      const rowKeys = Object.keys(row);
      let name = '';
      // Try numeric key
      if (row[VOYAGE_AWARDS_COLUMNS.NAME] !== undefined) {
        name = (row[VOYAGE_AWARDS_COLUMNS.NAME] || '').trim();
      } else {
        // Try header-keyed lookup
        for (const key of rowKeys) {
          const kl = key.toLowerCase().replace(/[_\s]/g, '');
          if (kl === 'name' || kl === 'sailor') {
            name = (row[key] || '').trim();
            break;
          }
        }
        // Positional fallback (column B = index 1)
        if (!name && rowKeys.length > 1) {
          name = (row[rowKeys[1]] || '').trim();
        }
      }
      // Strip bracket tags before checking
      name = name.replace(/\[.*?\]\s*/g, '').trim();
      return name && name.toLowerCase() !== 'name' && name !== '-';
    })
    .map((row) => parseLeaderboardEntry(row));
  
  // Log parsed leaderboard summary for debugging
  console.log(`[Voyage Awards] Parsed ${parsed.length} leaderboard entries:`, parsed.map(e => `${e.name}(v:${e.voyageCount},h:${e.hostCount})`).join(', '));
  
  return parsed;
};

/**
 * Parse subclass progress from Role/Coin Awards sheet
 */
export const parseSubclassProgress = (row: Record<string, string>): ParsedSubclassProgress => {
  return {
    name: (row[ROLE_COIN_COLUMNS.NAME] || '').trim(),
    totalVoyages: parseInt((row[ROLE_COIN_COLUMNS.TOTAL_VOYAGES] || '0').trim(), 10) || 0,
    carpenter: parseInt((row[ROLE_COIN_COLUMNS.CARPENTER] || '0').trim(), 10) || 0,
    flex: parseInt((row[ROLE_COIN_COLUMNS.FLEX] || '0').trim(), 10) || 0,
    cannoneer: parseInt((row[ROLE_COIN_COLUMNS.CANNONEER] || '0').trim(), 10) || 0,
    helm: parseInt((row[ROLE_COIN_COLUMNS.HELM] || '0').trim(), 10) || 0,
    grenadierPoints: parseInt((row[ROLE_COIN_COLUMNS.GRENADIER_POINTS] || '0').trim(), 10) || 0,
    fieldSurgeonPoints: parseInt((row[ROLE_COIN_COLUMNS.FIELD_SURGEON_POINTS] || '0').trim(), 10) || 0,
    isPirateLegend: (row[ROLE_COIN_COLUMNS.PIRATE_LEGEND] || '').toLowerCase().includes('yes'),
    hasCommanderCoin: (row[ROLE_COIN_COLUMNS.COMMANDER_CHALLENGE_COIN] || '').toLowerCase().includes('yes'),
    hasOfficerCoin: (row[ROLE_COIN_COLUMNS.OFFICER_CHALLENGE_COIN] || '').toLowerCase().includes('yes'),
  };
};

/**
 * Parse all subclass progress entries
 */
export const parseAllSubclassProgress = (rows: Record<string, string>[]): ParsedSubclassProgress[] => {
  return rows
    .filter((row) => {
      const name = (row[ROLE_COIN_COLUMNS.NAME] || '').trim();
      return name && name.toLowerCase() !== 'name';
    })
    .map((row) => parseSubclassProgress(row));
};

/**
 * Normalize a name for matching — strip bracket tags like [LOA-1], trim whitespace
 */
const normalizeName = (name: string): string => {
  return name.replace(/\[.*?\]\s*/g, '').trim().toLowerCase();
};

/**
 * Match crew member from Gullinbursti with leaderboard data from Voyage Awards
 * Returns enriched crew member with voyage/host counts and dates for compliance checks
 */
export const enrichCrewWithLeaderboardData = (
  crewMember: ParsedCrewMember,
  leaderboardData: ParsedLeaderboardEntry[]
): ParsedCrewMember & { voyageCount: number; hostCount: number; daysInactive: number; lastVoyageDate: string; lastHostDate: string } => {
  const crewNameNorm = normalizeName(crewMember.name);
  
  // Try exact match first, then fuzzy (startsWith / includes)
  let leaderboardEntry = leaderboardData.find((l) => normalizeName(l.name) === crewNameNorm);
  if (!leaderboardEntry && crewNameNorm.length >= 3) {
    leaderboardEntry = leaderboardData.find((l) => {
      const lName = normalizeName(l.name);
      return lName.startsWith(crewNameNorm) || crewNameNorm.startsWith(lName);
    });
  }

  // Diagnostic: log match results
  if (!leaderboardEntry) {
    console.warn(`[Enrichment] No match for "${crewMember.name}" (normalized: "${crewNameNorm}"). Available names:`, leaderboardData.map(l => l.name).join(', '));
  } else {
    console.log(`[Enrichment] Matched "${crewMember.name}" → "${leaderboardEntry.name}" (voyages: ${leaderboardEntry.voyageCount}, hosts: ${leaderboardEntry.hostCount}, daysInactive: ${leaderboardEntry.daysInactive})`);
  }

  return {
    ...crewMember,
    voyageCount: leaderboardEntry?.voyageCount || 0,
    hostCount: leaderboardEntry?.hostCount || 0,
    daysInactive: leaderboardEntry?.daysInactive || 0,
    lastVoyageDate: leaderboardEntry?.lastVoyageDate || '',
    lastHostDate: leaderboardEntry?.lastHostDate || '',
  };
};

/**
 * Get top hosts from leaderboard data (sorted by host count)
 */
export const getTopHosts = (leaderboardData: ParsedLeaderboardEntry[], limit: number = 5): ParsedLeaderboardEntry[] => {
  return leaderboardData
    .filter((entry) => entry.hostCount > 0)
    .sort((a, b) => b.hostCount - a.hostCount)
    .slice(0, limit);
};

/**
 * Get top voyagers from leaderboard data (sorted by voyage count)
 */
export const getTopVoyagers = (
  leaderboardData: ParsedLeaderboardEntry[],
  limit: number = 5
): ParsedLeaderboardEntry[] => {
  return leaderboardData
    .filter((entry) => entry.voyageCount > 0)
    .sort((a, b) => b.voyageCount - a.voyageCount)
    .slice(0, limit);
};

/**
 * Parse staff comments to generate actions
 * Looks for keywords like: deckhand, sail, host, engage, promote, suspend, etc.
 */
export const parseStaffComments = (
  crew: ParsedCrewMember[],
  actionIdStart: number = 0
): GeneratedAction[] => {
  const actions: GeneratedAction[] = [];
  let actionId = actionIdStart;

  // Keywords that trigger action generation
  const keywordMap: Record<string, { type: string; severity: 'high' | 'medium' | 'low'; responsible: (squad: string) => string }> = {
    deckhand: {
      type: 'deckhand-action',
      severity: 'high',
      responsible: () => 'Chief of Ship / Command',
    },
    demote: {
      type: 'demotion-pending',
      severity: 'high',
      responsible: () => 'Chief of Ship / Command',
    },
    suspend: {
      type: 'suspension-pending',
      severity: 'high',
      responsible: () => 'Chief of Ship / Command',
    },
    promote: {
      type: 'promotion-eligible',
      severity: 'medium',
      responsible: () => 'First Officer',
    },
    sail: {
      type: 'encourage-sailing',
      severity: 'medium',
      responsible: (squad) => `${squad} Squad Leader`,
    },
    host: {
      type: 'encourage-hosting',
      severity: 'medium',
      responsible: (squad) => `${squad} Squad Leader`,
    },
    engage: {
      type: 'engagement-needed',
      severity: 'low',
      responsible: (squad) => `${squad} Squad Leader`,
    },
    chat: {
      type: 'chat-activity',
      severity: 'low',
      responsible: (squad) => `${squad} Squad Leader`,
    },
  };

  crew.forEach((member) => {
    // Parse COS notes
    if (member.cosNotes) {
      const cosLower = member.cosNotes.toLowerCase();
      Object.entries(keywordMap).forEach(([keyword, config]) => {
        if (cosLower.includes(keyword)) {
          // Extract potential deadline (e.g., "by 15th February" or "15/02")
          const dateMatch = member.cosNotes?.match(/(\d{1,2}[\/\-]\d{1,2}|by\s+\d{1,2}(?:st|nd|rd|th)?)/i);
          const deadline = dateMatch ? dateMatch[0] : undefined;

          actions.push({
            id: String(actionId++),
            type: config.type,
            severity: config.severity,
            sailor: member.name,
            squad: member.squad,
            responsible: config.responsible(member.squad),
            description: `${config.type.replace(/-/g, ' ').charAt(0).toUpperCase() + config.type.slice(1).replace(/-/g, ' ')}`,
            details: member.cosNotes || 'Action required by Chief of Ship',
            source: 'comment',
            deadline,
          });
        }
      });
    }

    // Parse Squad Leader comments
    if (member.squadLeaderComments) {
      const slLower = member.squadLeaderComments.toLowerCase();
      Object.entries(keywordMap).forEach(([keyword, config]) => {
        if (slLower.includes(keyword)) {
          const dateMatch = member.squadLeaderComments?.match(/(\d{1,2}[\/\-]\d{1,2}|by\s+\d{1,2}(?:st|nd|rd|th)?)/i);
          const deadline = dateMatch ? dateMatch[0] : undefined;

          actions.push({
            id: String(actionId++),
            type: config.type,
            severity: config.severity,
            sailor: member.name,
            squad: member.squad,
            responsible: config.responsible(member.squad),
            description: `${config.type.replace(/-/g, ' ').charAt(0).toUpperCase() + config.type.slice(1).replace(/-/g, ' ')}`,
            details: member.squadLeaderComments || 'Action required by Squad Leader',
            source: 'comment',
            deadline,
          });
        }
      });
    }
  });

  return actions;
};

/**
 * Get responsible staff for an action type
 */
export const getResponsibleStaff = (actionType: string, squad: string): string => {
  // Map squad names to squad leader names
  const getSquadLeader = (sq: string): string => {
    const sqLower = sq.toLowerCase();
    if (sqLower.includes('necro')) return 'Necro';
    if (sqLower.includes('shade')) return 'Shade';
    return sq; // fallback to squad name
  };

  if (
    actionType === 'compliance-issue' ||
    actionType === 'sailing-issue' ||
    actionType === 'hosting-issue' ||
    actionType === 'deckhand-action' ||
    actionType === 'demotion-pending' ||
    actionType === 'suspension-pending'
  ) {
    return 'Spice';
  }

  if (actionType === 'award-eligible' || actionType === 'subclass-ready' || actionType === 'promotion-eligible') {
    return 'LadyHoit';
  }

  if (
    actionType === 'no-chat-activity' ||
    actionType === 'low-chat-activity' ||
    actionType === 'encourage-sailing' ||
    actionType === 'encourage-hosting' ||
    actionType === 'engagement-needed' ||
    actionType === 'chat-activity'
  ) {
    return getSquadLeader(squad);
  }

  return 'Hoit';
};

export default {
  parseCrewMember,
  parseAllCrewMembers,
  parseLeaderboardEntry,
  parseAllLeaderboardEntries,
  parseSubclassProgress,
  parseAllSubclassProgress,
  enrichCrewWithLeaderboardData,
  getTopHosts,
  getTopVoyagers,
  parseStaffComments,
  getResponsibleStaff,
};
