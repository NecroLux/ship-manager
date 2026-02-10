/**
 * Naval Rank and Award Configuration
 * Organized structure for the USN Ship Manager Actions system
 */

export interface Rank {
  code: string;
  name: string;
  rate: 'JE' | 'NCO' | 'SNCO' | 'JO' | 'SO';
  payGrade: number;
  abbreviation: string;
}

export interface Medal {
  id: string;
  name: string;
  category: 'conduct' | 'voyage' | 'combat' | 'other' | 'misc' | 'service' | 'role';
  requirements: string;
  minRankCode: string;
  prerequisites?: string[]; // Other medals required first
  issuedBy: string[]; // Ranks responsible for issuing
}

export interface ActionRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  check: (sailor: any) => boolean;
}

// ==================== RANKS ====================
export const RANKS: Record<string, Rank> = {
  'E-2': {
    code: 'E-2',
    name: 'Seaman/Seawoman',
    rate: 'JE',
    payGrade: 2,
    abbreviation: 'SM',
  },
  'E-3': {
    code: 'E-3',
    name: 'Able Seaman/Seawoman',
    rate: 'JE',
    payGrade: 3,
    abbreviation: 'AS',
  },
  'E-4': {
    code: 'E-4',
    name: 'Junior Petty Officer',
    rate: 'NCO',
    payGrade: 4,
    abbreviation: 'JPO',
  },
  'E-6': {
    code: 'E-6',
    name: 'Petty Officer',
    rate: 'NCO',
    payGrade: 6,
    abbreviation: 'PO',
  },
  'E-7': {
    code: 'E-7',
    name: 'Chief Petty Officer',
    rate: 'SNCO',
    payGrade: 7,
    abbreviation: 'CPO',
  },
  'E-8': {
    code: 'E-8',
    name: 'Senior Chief Petty Officer',
    rate: 'SNCO',
    payGrade: 8,
    abbreviation: 'SCPO',
  },
  'O-1': {
    code: 'O-1',
    name: 'Midshipman/Midshipwoman',
    rate: 'JO',
    payGrade: 1,
    abbreviation: 'MIDN',
  },
  'O-3': {
    code: 'O-3',
    name: 'Lieutenant',
    rate: 'JO',
    payGrade: 3,
    abbreviation: 'LT',
  },
  'O-4': {
    code: 'O-4',
    name: 'Lieutenant Commander',
    rate: 'SO',
    payGrade: 4,
    abbreviation: 'LC',
  },
  'O-5': {
    code: 'O-5',
    name: 'Commander',
    rate: 'SO',
    payGrade: 5,
    abbreviation: 'CDR',
  },
  'O-6': {
    code: 'O-6',
    name: 'Captain',
    rate: 'SO',
    payGrade: 6,
    abbreviation: 'CAPT',
  },
  'O-7': {
    code: 'O-7',
    name: 'Commodore',
    rate: 'SO',
    payGrade: 7,
    abbreviation: 'CDRE',
  },
  'O-8': {
    code: 'O-8',
    name: 'Rear Admiral',
    rate: 'SO',
    payGrade: 8,
    abbreviation: 'RADM',
  },
  'O-9': {
    code: 'O-9',
    name: 'Vice Admiral',
    rate: 'SO',
    payGrade: 9,
    abbreviation: 'VADM',
  },
  'O-10': {
    code: 'O-10',
    name: 'Admiral of the Navy',
    rate: 'SO',
    payGrade: 10,
    abbreviation: 'ADM',
  },
};

// ==================== MEDALS & AWARDS ====================
export const MEDALS: Record<string, Medal> = {
  // Conduct Medals
  'citation-conduct': {
    id: 'citation-conduct',
    name: 'Citation of Conduct',
    category: 'conduct',
    requirements: 'Fair activity in ship chats',
    minRankCode: 'E-6',
    issuedBy: ['E-6', 'E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'legion-conduct': {
    id: 'legion-conduct',
    name: 'Legion of Conduct',
    category: 'conduct',
    requirements: 'Moderate activity in ship chats',
    minRankCode: 'E-7',
    prerequisites: ['citation-conduct'],
    issuedBy: ['E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'honorable-conduct': {
    id: 'honorable-conduct',
    name: 'Honorable Conduct Medal',
    category: 'conduct',
    requirements: 'Moderate activity in ship chats + hosts more than 1 voyage per 2 weeks on average + Moderate activity in NETC/SPD',
    minRankCode: 'O-1',
    prerequisites: ['legion-conduct'],
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'meritorious-conduct': {
    id: 'meritorious-conduct',
    name: 'Meritorious Conduct Medal',
    category: 'conduct',
    requirements: 'High activity in ship chats + High activity in NETC/SPD + Letter of Recommendation',
    minRankCode: 'O-4',
    prerequisites: ['honorable-conduct'],
    issuedBy: ['O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'admirable-conduct': {
    id: 'admirable-conduct',
    name: 'Admirable Conduct Medal',
    category: 'conduct',
    requirements: 'Incredible activity in ship chats + Incredible activity in NETC/SPD',
    minRankCode: 'O-7',
    prerequisites: ['meritorious-conduct'],
    issuedBy: ['O-7', 'O-8', 'O-9', 'O-10'],
  },

  // Voyage Medals - Attending
  'citation-voyages': {
    id: 'citation-voyages',
    name: 'Citation of Voyages',
    category: 'voyage',
    requirements: '5 Voyages with no disciplinary issues',
    minRankCode: 'E-6',
    issuedBy: ['E-6', 'E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'legion-voyages': {
    id: 'legion-voyages',
    name: 'Legion of Voyages',
    category: 'voyage',
    requirements: '25 Voyages with no disciplinary issues + High activity in squad chats',
    minRankCode: 'E-7',
    prerequisites: ['citation-voyages'],
    issuedBy: ['E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'honorable-voyager': {
    id: 'honorable-voyager',
    name: 'Honorable Voyager Medal',
    category: 'voyage',
    requirements: '50 Voyages attended',
    minRankCode: 'O-1',
    prerequisites: ['legion-voyages'],
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'meritorious-voyager': {
    id: 'meritorious-voyager',
    name: 'Meritorious Voyager Medal',
    category: 'voyage',
    requirements: '100 Voyages attended',
    minRankCode: 'O-4',
    prerequisites: ['honorable-voyager'],
    issuedBy: ['O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'admirable-voyager': {
    id: 'admirable-voyager',
    name: 'Admirable Voyager Medal',
    category: 'voyage',
    requirements: '200 Voyages attended',
    minRankCode: 'O-7',
    prerequisites: ['meritorious-voyager'],
    issuedBy: ['O-7', 'O-8', 'O-9', 'O-10'],
  },

  // Voyage Medals - Hosting
  'sea-service': {
    id: 'sea-service',
    name: 'Sea Service Ribbon',
    category: 'voyage',
    requirements: '25 Hosted Voyages + High activity in squad chats',
    minRankCode: 'E-7',
    issuedBy: ['E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'maritime-service': {
    id: 'maritime-service',
    name: 'Maritime Service Medal',
    category: 'voyage',
    requirements: '50 Hosted Voyages',
    minRankCode: 'O-1',
    prerequisites: ['sea-service'],
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'legendary-service': {
    id: 'legendary-service',
    name: 'Legendary Service Medal',
    category: 'voyage',
    requirements: '100 Hosted Voyages',
    minRankCode: 'O-4',
    prerequisites: ['maritime-service'],
    issuedBy: ['O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'admirable-service': {
    id: 'admirable-service',
    name: 'Admirable Service Medal',
    category: 'voyage',
    requirements: '200 Hosted Voyages',
    minRankCode: 'O-7',
    prerequisites: ['legendary-service'],
    issuedBy: ['O-7', 'O-8', 'O-9', 'O-10'],
  },

  // Public Service
  'public-service-ribbon': {
    id: 'public-service-ribbon',
    name: 'Public Service Ribbon',
    category: 'voyage',
    requirements: '10 Voyages hosted through Voyage Planning',
    minRankCode: 'E-7',
    issuedBy: ['E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'maritime-public-service': {
    id: 'maritime-public-service',
    name: 'Maritime Public Service Medal',
    category: 'voyage',
    requirements: '25 Voyages hosted through Voyage Planning',
    minRankCode: 'O-1',
    prerequisites: ['public-service-ribbon'],
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },

  // Combat Medals
  'citation-combat': {
    id: 'citation-combat',
    name: 'Citation of Combat',
    category: 'combat',
    requirements: '2 sinks on official Skirmish',
    minRankCode: 'E-6',
    issuedBy: ['E-6', 'E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'legion-combat': {
    id: 'legion-combat',
    name: 'Legion of Combat',
    category: 'combat',
    requirements: '3 win streak on official Skirmish',
    minRankCode: 'E-7',
    prerequisites: ['citation-combat'],
    issuedBy: ['E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'honorable-combat': {
    id: 'honorable-combat',
    name: 'Honorable Combat Action',
    category: 'combat',
    requirements: '5 win streak on official Skirmish',
    minRankCode: 'O-1',
    prerequisites: ['legion-combat'],
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },

  // Service Stripes
  '4-month-stripe': {
    id: '4-month-stripe',
    name: '4 Months Service Stripe',
    category: 'service',
    requirements: 'Serve 4 months in the Navy',
    minRankCode: 'E-2',
    issuedBy: ['E-6', 'E-7', 'E-8'],
  },
  '6-month-stripe': {
    id: '6-month-stripe',
    name: '6 Months Service Stripe',
    category: 'service',
    requirements: 'Serve 6 months in the Navy',
    minRankCode: 'E-2',
    prerequisites: ['4-month-stripe'],
    issuedBy: ['E-6', 'E-7', 'E-8'],
  },
  '12-month-stripe': {
    id: '12-month-stripe',
    name: '12 Months Service Stripe',
    category: 'service',
    requirements: 'Serve 12 months in the Navy',
    minRankCode: 'E-2',
    prerequisites: ['6-month-stripe'],
    issuedBy: ['E-6', 'E-7', 'E-8'],
  },

  // Leadership & Ribbons
  'leadership-accolade': {
    id: 'leadership-accolade',
    name: 'Leadership Accolade',
    category: 'other',
    requirements: 'E-4+ with proven strong leadership and growth',
    minRankCode: 'E-4',
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'nco-improvement-ribbon': {
    id: 'nco-improvement-ribbon',
    name: 'NCO Improvement Ribbon',
    category: 'misc',
    requirements: 'Demonstrated knowledge of leadership, role, and expectations. REQUIRED to promote past E-4',
    minRankCode: 'E-4',
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
  'officer-improvement-ribbon': {
    id: 'officer-improvement-ribbon',
    name: 'Officer Improvement Ribbon',
    category: 'misc',
    requirements: 'Demonstrated Officer knowledge and expectations. REQUIRED to promote past O-3',
    minRankCode: 'O-1',
    issuedBy: ['O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },

  // Challenge Coins
  'challenge-coin': {
    id: 'challenge-coin',
    name: 'Challenge Coin',
    category: 'other',
    requirements: 'Complete a challenge set by a Junior Officer or impress a Junior Officer',
    minRankCode: 'E-2',
    issuedBy: ['O-1', 'O-3'],
  },
  'commanders-challenge-coin': {
    id: 'commanders-challenge-coin',
    name: 'Commanders Challenge Coin',
    category: 'other',
    requirements: 'Complete a challenge set by a Senior Officer or impress a Senior Officer',
    minRankCode: 'E-2',
    issuedBy: ['O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  },
};

// ==================== ACTION RULES ====================
export const ACTION_RULES = {
  LOW_CHAT_ACTIVITY: {
    id: 'low-chat-activity',
    name: 'Low Chat Activity',
    description: 'Crew member has activity rating below 2 stars',
    severity: 'medium' as const,
  },
  NO_CHAT_ACTIVITY: {
    id: 'no-chat-activity',
    name: 'No Chat Activity',
    description: 'Crew member has no recorded chat activity',
    severity: 'high' as const,
  },
  MISSING_CONDUCT_MEDAL: {
    id: 'missing-conduct-medal',
    name: 'Missing Conduct Medal',
    description: 'Eligible rank missing appropriate conduct medal',
    severity: 'medium' as const,
  },
  MISSING_VOYAGE_MEDAL: {
    id: 'missing-voyage-medal',
    name: 'Missing Voyage Medal',
    description: 'Eligible rank likely missing voyage medal (insufficient voyages logged)',
    severity: 'low' as const,
  },
  MISSING_SERVICE_STRIPE: {
    id: 'missing-service-stripe',
    name: 'Missing Service Stripe',
    description: 'Crew member may be due for service stripe (check join date)',
    severity: 'low' as const,
  },
  MISSING_IMPROVEMENT_RIBBON: {
    id: 'missing-improvement-ribbon',
    name: 'Missing Required Ribbon',
    description: 'NCO/Officer missing required improvement ribbon for promotion',
    severity: 'high' as const,
  },
  PROMOTION_ELIGIBLE: {
    id: 'promotion-eligible',
    name: 'Promotion Eligible',
    description: 'Crew member may be eligible for promotion',
    severity: 'low' as const,
  },
  COMPLIANCE_FLAGGED: {
    id: 'compliance-flagged',
    name: 'Compliance Issue',
    description: 'Crew member flagged or requires attention in compliance',
    severity: 'high' as const,
  },
};

// ==================== UTILITY FUNCTIONS ====================
export const getRankByCode = (code: string): Rank | undefined => {
  return RANKS[code];
};

export const getRankPayGrade = (code: string): number => {
  return RANKS[code]?.payGrade || 0;
};

export const getMedalsByRank = (rankCode: string): Medal[] => {
  return Object.values(MEDALS).filter(
    (medal) => getRankPayGrade(rankCode) >= getRankPayGrade(medal.minRankCode)
  );
};

export const isRankHigherOrEqual = (rankCode1: string, rankCode2: string): boolean => {
  return getRankPayGrade(rankCode1) >= getRankPayGrade(rankCode2);
};

export const getRateCategory = (rankCode: string): string => {
  const rank = RANKS[rankCode];
  if (!rank) return 'Unknown';

  const rateNames: Record<string, string> = {
    JE: 'Junior Enlisted',
    NCO: 'Non-Commissioned Officer',
    SNCO: 'Senior Non-Commissioned Officer',
    JO: 'Junior Officer',
    SO: 'Senior Officer',
  };

  return rateNames[rank.rate] || 'Unknown';
};
