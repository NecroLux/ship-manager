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

// ==================== PARSER FUNCTIONS ====================

/**
 * Parse a single crew member from Gullinbursti sheet
 */
export const parseCrewMember = (row: Record<string, string>): ParsedCrewMember => {
  const rank = (row[GULLINBURSTI_COLUMNS.RANK] || '').trim();
  const name = (row[GULLINBURSTI_COLUMNS.NAME] || '').trim();

  // Extract compliance booleans
  const sailingCompliant = (row[GULLINBURSTI_COLUMNS.SAILING_COMPLIANCE] || '').toLowerCase().includes('yes');
  const hostingCompliant = (row[GULLINBURSTI_COLUMNS.HOSTING_COMPLIANCE] || '').toLowerCase().includes('yes');

  // Parse chat activity (could be stars ★, number, or text)
  let chatActivity = 0;
  const activityRaw = (row[GULLINBURSTI_COLUMNS.CHAT_ACTIVITY] || '').trim();
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
  const birthday = (row[GULLINBURSTI_COLUMNS.BIRTHDAY] || '').trim();

  // Squad extraction: try header search, fallback to column 3
  let squad = (row[GULLINBURSTI_COLUMNS.SQUAD_LEADER_COMMENTS] || '').trim().split('\n')[0] || 'Unassigned';
  // Note: In actual implementation, we'd scan through headers to find squad column

  return {
    rank,
    name,
    discordUsername: (row[GULLINBURSTI_COLUMNS.DISCORD_USERNAME] || '').trim(),
    discordId: (row[GULLINBURSTI_COLUMNS.DISCORD_ID] || '').trim(),
    squad,
    timezone: (row[GULLINBURSTI_COLUMNS.TIMEZONE] || '').trim() || 'Unknown',
    inGuild: (row[GULLINBURSTI_COLUMNS.IN_GUILD_INDICATOR] || '').toLowerCase().includes('yes'),
    xboxGamertag: (row[GULLINBURSTI_COLUMNS.GAMERTAG_XBOX] || '').trim() || undefined,
    loaStatus: isOnLOA(row),
    loaReturnDate: (row[GULLINBURSTI_COLUMNS.LOA_RETURN_DATE] || '').trim() || undefined,
    chatActivity,
    sailingCompliant,
    hostingCompliant,
    canHostRank: canHost(rank),
    mustSailRank: mustSail(rank),
    squadLeaderComments: (row[GULLINBURSTI_COLUMNS.SQUAD_LEADER_COMMENTS] || '').trim() || undefined,
    cosNotes: (row[GULLINBURSTI_COLUMNS.COS_NOTES] || '').trim() || undefined,
    birthday: birthday || undefined,
    spd: (row[GULLINBURSTI_COLUMNS.SPD_INDICATOR] || '').toLowerCase().includes('yes') ? 'Yes' : undefined,
    spdName: (row[GULLINBURSTI_COLUMNS.SPD_NAME] || '').trim() || undefined,
    serviceStripe: (row[GULLINBURSTI_COLUMNS.SERVICE_STRIPE] || '').toLowerCase().includes('yes'),
    serviceStripeCorrect: (row[GULLINBURSTI_COLUMNS.SERVICE_STRIPE_CORRECT] || '').toLowerCase().includes('yes'),
    promotionEligible: (row[GULLINBURSTI_COLUMNS.PROMOTION_ELIGIBLE] || '').toLowerCase().includes('yes'),
  };
};

/**
 * Parse all crew members from Gullinbursti sheet
 */
export const parseAllCrewMembers = (rows: Record<string, string>[]): ParsedCrewMember[] => {
  return rows
    .filter((row) => {
      // Skip empty rows and header rows
      const rank = (row[GULLINBURSTI_COLUMNS.RANK] || '').trim();
      const name = (row[GULLINBURSTI_COLUMNS.NAME] || '').trim();
      if (!rank || !name) return false;
      if (rank.toLowerCase() === 'rank' && name.toLowerCase() === 'name') return false;
      return true;
    })
    .map((row) => parseCrewMember(row));
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
};
