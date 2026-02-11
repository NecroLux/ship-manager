/**
 * Data Parser Service
 * Normalizes raw sheet data into typed interfaces
 * Single source of truth for all data transformation
 */

import {
  GULLINBURSTI_COLUMNS,
  VOYAGE_AWARDS_COLUMNS,
  ROLE_COIN_COLUMNS,
  isOnLOA,
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
  // Helper to get value by numeric index OR header name
  const getRowValue = (numIndex: number, ...headerNames: string[]): string => {
    // Try numeric index first
    if (row[numIndex] !== undefined) {
      return row[numIndex] || '';
    }
    // Try header names
    for (const headerName of headerNames) {
      if (row[headerName] !== undefined) {
        return row[headerName] || '';
      }
    }
    return '';
  };

  const rank = getRowValue(GULLINBURSTI_COLUMNS.RANK, 'Rank', 'RANK', 'rank').trim();
  const name = getRowValue(GULLINBURSTI_COLUMNS.NAME, 'Name', 'NAME', 'name').trim();

  // Extract compliance booleans
  const sailingCompliant = getRowValue(GULLINBURSTI_COLUMNS.SAILING_COMPLIANCE, 'Sailing Compliance', 'SAILING_COMPLIANCE').toLowerCase().includes('yes');
  const hostingCompliant = getRowValue(GULLINBURSTI_COLUMNS.HOSTING_COMPLIANCE, 'Hosting Compliance', 'HOSTING_COMPLIANCE').toLowerCase().includes('yes');

  // Parse chat activity (could be stars ★, number, or text)
  let chatActivity = 0;
  const activityRaw = getRowValue(GULLINBURSTI_COLUMNS.CHAT_ACTIVITY, 'Chat Activity', 'CHAT_ACTIVITY').trim();
  const starCount = (activityRaw.match(/[★*]/g) || []).length;
  if (starCount > 0) {
    chatActivity = starCount;
  } else {
    const numMatch = activityRaw.match(/\d+/);
    if (numMatch) {
      chatActivity = Math.min(parseInt(numMatch[0], 10), 5);
    }
  }

  // Extract birthday (MM/DD only, no year)
  const birthday = getRowValue(GULLINBURSTI_COLUMNS.BIRTHDAY, 'Birthday', 'BIRTHDAY').trim();

  // Get compliance status from LOA_STATUS column (column 8)
  const complianceStatus = getRowValue(GULLINBURSTI_COLUMNS.LOA_STATUS, 'LOA Status', 'LOA_STATUS').trim() || 'Unknown';

  // Squad extraction: try header search, fallback to column 3
  let squad = getRowValue(GULLINBURSTI_COLUMNS.SQUAD_LEADER_COMMENTS, 'Squad Leader Comments', 'SQUAD_LEADER_COMMENTS').trim().split('\n')[0] || 'Unassigned';
  // Note: In actual implementation, we'd scan through headers to find squad column

  return {
    rank,
    name,
    discordUsername: getRowValue(GULLINBURSTI_COLUMNS.DISCORD_USERNAME, 'Discord Username', 'DISCORD_USERNAME').trim(),
    discordId: getRowValue(GULLINBURSTI_COLUMNS.DISCORD_ID, 'Discord ID', 'DISCORD_ID').trim(),
    squad,
    timezone: getRowValue(GULLINBURSTI_COLUMNS.TIMEZONE, 'Timezone', 'TIMEZONE').trim() || 'Unknown',
    inGuild: getRowValue(GULLINBURSTI_COLUMNS.IN_GUILD_INDICATOR, 'In Guild', 'IN_GUILD_INDICATOR').toLowerCase().includes('yes'),
    xboxGamertag: getRowValue(GULLINBURSTI_COLUMNS.GAMERTAG_XBOX, 'Xbox Gamertag', 'GAMERTAG_XBOX').trim() || undefined,
    loaStatus: isOnLOA(row),
    loaReturnDate: getRowValue(GULLINBURSTI_COLUMNS.LOA_RETURN_DATE, 'LOA Return Date', 'LOA_RETURN_DATE').trim() || undefined,
    complianceStatus,
    chatActivity,
    sailingCompliant,
    hostingCompliant,
    canHostRank: canHost(rank),
    mustSailRank: mustSail(rank),
    squadLeaderComments: getRowValue(GULLINBURSTI_COLUMNS.SQUAD_LEADER_COMMENTS, 'Squad Leader Comments', 'SQUAD_LEADER_COMMENTS').trim() || undefined,
    cosNotes: getRowValue(GULLINBURSTI_COLUMNS.COS_NOTES, 'COS Notes', 'COS_NOTES').trim() || undefined,
    birthday: birthday || undefined,
    spd: getRowValue(GULLINBURSTI_COLUMNS.SPD_INDICATOR, 'SPD Indicator', 'SPD_INDICATOR').toLowerCase().includes('yes') ? 'Yes' : undefined,
    spdName: getRowValue(GULLINBURSTI_COLUMNS.SPD_NAME, 'SPD Name', 'SPD_NAME').trim() || undefined,
    serviceStripe: getRowValue(GULLINBURSTI_COLUMNS.SERVICE_STRIPE, 'Service Stripe', 'SERVICE_STRIPE').toLowerCase().includes('yes'),
    serviceStripeCorrect: getRowValue(GULLINBURSTI_COLUMNS.SERVICE_STRIPE_CORRECT, 'Service Stripe Correct', 'SERVICE_STRIPE_CORRECT').toLowerCase().includes('yes'),
    promotionEligible: getRowValue(GULLINBURSTI_COLUMNS.PROMOTION_ELIGIBLE, 'Promotion Eligible', 'PROMOTION_ELIGIBLE').toLowerCase().includes('yes'),
  };
};

/**
 * Parse all crew members from Gullinbursti sheet
 * Handles squad headers (rows with rank but no name) to track squad assignments
 */
export const parseAllCrewMembers = (rows: Record<string, string>[]): ParsedCrewMember[] => {
  const result: ParsedCrewMember[] = [];
  let currentSquad = 'Unassigned';

  for (const row of rows) {
    // Get values by either numeric index or header name
    const getRowValue = (numIndex: number, ...headerNames: string[]): string => {
      // Try numeric index first
      if (row[numIndex] !== undefined) {
        return (row[numIndex] || '').trim();
      }
      // Try header names
      for (const headerName of headerNames) {
        if (row[headerName] !== undefined) {
          return (row[headerName] || '').trim();
        }
      }
      return '';
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
      crewMember.squad = currentSquad;
      result.push(crewMember);
    }
  }

  return result;
};

/**
 * Parse leaderboard entry from Time/Voyage Awards sheet
 */
export const parseLeaderboardEntry = (row: Record<string, string>): ParsedLeaderboardEntry => {
  const voyageCount = parseInt((row[VOYAGE_AWARDS_COLUMNS.TOTAL_VOYAGES] || '0').trim(), 10) || 0;
  const hostCount = parseInt((row[VOYAGE_AWARDS_COLUMNS.HOST_COUNT] || '0').trim(), 10) || 0;
  const daysInactive = parseInt((row[VOYAGE_AWARDS_COLUMNS.DAYS_INACTIVE] || '0').trim(), 10) || 0;

  return {
    name: (row[VOYAGE_AWARDS_COLUMNS.NAME] || '').trim(),
    rank: (row[VOYAGE_AWARDS_COLUMNS.RANK] || '').trim(),
    role: (row[VOYAGE_AWARDS_COLUMNS.ROLE] || '').trim(),
    joinDate: (row[VOYAGE_AWARDS_COLUMNS.JOIN_DATE] || '').trim(),
    lastVoyageDate: (row[VOYAGE_AWARDS_COLUMNS.LAST_VOYAGE_DATE] || '').trim(),
    voyageCount,
    hostCount,
    daysInactive,
    timezone: (row[VOYAGE_AWARDS_COLUMNS.TIMEZONE] || '').trim(),
    inGuild: (row[VOYAGE_AWARDS_COLUMNS.IN_GUILD] || '').toLowerCase().includes('yes'),
  };
};

/**
 * Parse all leaderboard entries
 */
export const parseAllLeaderboardEntries = (rows: Record<string, string>[]): ParsedLeaderboardEntry[] => {
  return rows
    .filter((row) => {
      const name = (row[VOYAGE_AWARDS_COLUMNS.NAME] || '').trim();
      return name && name.toLowerCase() !== 'name';
    })
    .map((row) => parseLeaderboardEntry(row));
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
 * Match crew member from Gullinbursti with leaderboard data from Voyage Awards
 * Returns enriched crew member with voyage/host counts
 */
export const enrichCrewWithLeaderboardData = (
  crewMember: ParsedCrewMember,
  leaderboardData: ParsedLeaderboardEntry[]
): ParsedCrewMember & { voyageCount: number; hostCount: number; daysInactive: number } => {
  const leaderboardEntry = leaderboardData.find((l) => l.name.toLowerCase() === crewMember.name.toLowerCase());

  return {
    ...crewMember,
    voyageCount: leaderboardEntry?.voyageCount || 0,
    hostCount: leaderboardEntry?.hostCount || 0,
    daysInactive: leaderboardEntry?.daysInactive || 0,
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
  if (
    actionType === 'compliance-issue' ||
    actionType === 'sailing-issue' ||
    actionType === 'hosting-issue' ||
    actionType === 'deckhand-action' ||
    actionType === 'demotion-pending' ||
    actionType === 'suspension-pending'
  ) {
    return 'Chief of Ship / Command';
  }

  if (actionType === 'award-eligible' || actionType === 'subclass-ready' || actionType === 'promotion-eligible') {
    return 'First Officer';
  }

  if (
    actionType === 'no-chat-activity' ||
    actionType === 'low-chat-activity' ||
    actionType === 'encourage-sailing' ||
    actionType === 'encourage-hosting' ||
    actionType === 'engagement-needed' ||
    actionType === 'chat-activity'
  ) {
    return `${squad} Squad Leader`;
  }

  return 'Command';
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
