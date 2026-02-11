/**
 * USN Rank Hierarchy — codes, names, and tier classification.
 * Used for award eligibility checks and responsible-rank mapping.
 */

// ==================== RANK DEFINITIONS ====================

export interface RankDefinition {
  code: string;       // e.g. 'E-2', 'O-4'
  title: string;      // Primary title e.g. 'Seaman'
  altTitle?: string;   // Marine equivalent e.g. 'Private'
  tier: RankTier;
  level: number;       // Numeric sort order (higher = more senior)
}

export type RankTier =
  | 'recruit'
  | 'junior-enlisted'
  | 'nco'
  | 'snco'
  | 'junior-officer'
  | 'senior-officer'
  | 'admiralty'
  | 'warrant'
  | 'inactive';

export const RANKS: RankDefinition[] = [
  // Inactive / Special
  { code: 'Deckhand',  title: 'Deckhand',             tier: 'inactive',         level: 0 },
  { code: 'SA',        title: 'Seaman Apprentice',     tier: 'inactive',         level: 1 },
  { code: 'E-1',       title: 'Recruit',               tier: 'recruit',          level: 2 },

  // Junior Enlisted
  { code: 'E-2',       title: 'Seaman',                tier: 'junior-enlisted',  level: 3 },
  { code: 'E-3',       title: 'Able Seaman',           altTitle: 'Lance Corporal',  tier: 'junior-enlisted',  level: 4 },

  // Non-Commissioned Officers
  { code: 'E-4',       title: 'Junior Petty Officer',  altTitle: 'Corporal',        tier: 'nco',              level: 5 },
  { code: 'E-6',       title: 'Petty Officer',         altTitle: 'Staff Sergeant',  tier: 'nco',              level: 6 },

  // Senior Non-Commissioned Officers
  { code: 'E-7',       title: 'Chief Petty Officer',   altTitle: 'Gunnery Sergeant',  tier: 'snco',          level: 7 },
  { code: 'E-8',       title: 'Senior Chief Petty Officer', altTitle: 'Master Sergeant', tier: 'snco',       level: 8 },

  // Junior Officers
  { code: 'O-1',       title: 'Midshipman',            altTitle: 'Second Lieutenant', tier: 'junior-officer', level: 9 },
  { code: 'O-3',       title: 'Lieutenant',            altTitle: 'Marine Captain',    tier: 'junior-officer', level: 10 },

  // Senior Officers
  { code: 'O-4',       title: 'Lieutenant Commander',  altTitle: 'Major',             tier: 'senior-officer', level: 11 },
  { code: 'O-5',       title: 'Commander',             altTitle: 'Lieutenant Colonel', tier: 'senior-officer', level: 12 },
  { code: 'O-6',       title: 'Captain',               altTitle: 'Colonel',           tier: 'senior-officer', level: 13 },

  // Board of Admiralty
  { code: 'O-7',       title: 'Commodore',             altTitle: 'Brigadier General', tier: 'admiralty',      level: 14 },
  { code: 'O-8',       title: 'Rear Admiral',          altTitle: 'Major General',     tier: 'admiralty',      level: 15 },
  { code: 'O-9',       title: 'Vice Admiral',          tier: 'admiralty',             level: 16 },
  { code: 'O-10',      title: 'Admiral of the Navy',   tier: 'admiralty',             level: 17 },

  // Warrant
  { code: 'WO',        title: 'Warrant Officer',       tier: 'warrant',              level: 8 },
];

// ==================== HELPERS ====================

/**
 * Given a raw rank string from the sheet, return the matching RankDefinition.
 * Matches against title, altTitle and code (case-insensitive, fuzzy).
 */
export const resolveRank = (rawRank: string): RankDefinition | undefined => {
  if (!rawRank) return undefined;
  const r = rawRank.trim().toLowerCase();

  // Direct code match  (e.g. "E-4", "O-1")
  const byCode = RANKS.find((rk) => rk.code.toLowerCase() === r);
  if (byCode) return byCode;

  // Exact title / altTitle match
  const byTitle = RANKS.find(
    (rk) =>
      rk.title.toLowerCase() === r ||
      rk.altTitle?.toLowerCase() === r
  );
  if (byTitle) return byTitle;

  // Fuzzy: title starts with or includes
  // Handle common abbreviations: "SCPO", "CPO", "JPO", "PO", "MIDN", "Lt. Commander", etc.
  if (r.includes('admiral of the navy') || r === 'aotn') return RANKS.find((rk) => rk.code === 'O-10');
  if (r.includes('vice admiral')) return RANKS.find((rk) => rk.code === 'O-9');
  if (r.includes('rear admiral') || r === 'radm') return RANKS.find((rk) => rk.code === 'O-8');
  if (r.includes('commodore') || r.includes('brigadier')) return RANKS.find((rk) => rk.code === 'O-7');
  if (r.includes('captain') && !r.includes('marine')) return RANKS.find((rk) => rk.code === 'O-6');
  if (r.includes('lt. commander') || r.includes('lieutenant commander') || r === 'lcdr') return RANKS.find((rk) => rk.code === 'O-4');
  if (r.includes('commander') && !r.includes('lt') && !r.includes('lieutenant')) return RANKS.find((rk) => rk.code === 'O-5');
  if (r.includes('lieutenant') && !r.includes('commander') && !r.includes('colonel')) return RANKS.find((rk) => rk.code === 'O-3');
  if (r.includes('midship') || r === 'midn') return RANKS.find((rk) => rk.code === 'O-1');
  if (r === 'scpo' || r.includes('senior chief')) return RANKS.find((rk) => rk.code === 'E-8');
  if (r === 'cpo' || (r.includes('chief petty') && !r.includes('senior'))) return RANKS.find((rk) => rk.code === 'E-7');
  if (r === 'po' || (r.includes('petty officer') && !r.includes('junior') && !r.includes('chief') && !r.includes('senior'))) return RANKS.find((rk) => rk.code === 'E-6');
  if (r === 'jpo' || r.includes('junior petty') || r.includes('jr. petty') || r.includes('jr petty')) return RANKS.find((rk) => rk.code === 'E-4');
  if (r.includes('able seaman') || r.includes('able seawoman') || r === 'as') return RANKS.find((rk) => rk.code === 'E-3');
  if (r.includes('seaman') && !r.includes('able') && !r.includes('apprentice')) return RANKS.find((rk) => rk.code === 'E-2');
  if (r.includes('recruit')) return RANKS.find((rk) => rk.code === 'E-1');
  if (r.includes('warrant')) return RANKS.find((rk) => rk.code === 'WO');
  if (r === 'deckhand') return RANKS.find((rk) => rk.code === 'Deckhand');

  return undefined;
};

/**
 * Get the numeric level of a rank (higher = more senior).
 */
export const getRankLevel = (rawRank: string): number => {
  return resolveRank(rawRank)?.level ?? 0;
};

/**
 * Check if a rank is at or above a given code threshold.
 * e.g. isRankAtOrAbove('Chief Petty Officer', 'E-6') → true
 */
export const isRankAtOrAbove = (rawRank: string, thresholdCode: string): boolean => {
  const rank = resolveRank(rawRank);
  const threshold = RANKS.find((rk) => rk.code === thresholdCode);
  if (!rank || !threshold) return false;
  return rank.level >= threshold.level;
};

// ==================== SHIP COMMAND MAPPING ====================

/**
 * Ship command roles for our ship (USS Gullinbursti).
 * Used to map "Ranks Responsible" to actual people.
 */
export type ShipRole = 'co' | 'xo' | 'cos' | 'sl';

export interface ShipCommandMember {
  role: ShipRole;
  label: string;
  rankCode: string;
}
