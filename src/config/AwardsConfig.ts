/**
 * USN Awards Configuration — definitions, eligibility criteria, responsible ranks.
 *
 * Awards that can be AUTO-DETECTED from sheet data are marked `autoDetect: true`.
 * All others are listed for reference and can be manually assigned.
 */

// ==================== TYPES ====================

export type AwardCategory =
  | 'voyage-attending'
  | 'voyage-hosting'
  | 'voyage-public'
  | 'conduct'
  | 'combat'
  | 'service-stripes'
  | 'challenge-coins'
  | 'training'
  | 'representation'
  | 'subclass'
  | 'career'
  | 'other';

export interface AwardDefinition {
  id: string;
  name: string;
  category: AwardCategory;
  /** Human-readable requirements */
  requirements: string;
  /** Rank code that can award this (minimum). 'SL/CoS' for squad leader/chief of ship. */
  responsibleRank: string;
  /** Whether we can auto-detect eligibility from sheet data */
  autoDetect: boolean;
  /** Numeric thresholds for auto-detection (optional) */
  thresholds?: {
    voyages?: number;
    hosted?: number;
    chatActivityMin?: number;   // 0-5 scale
    serviceMonths?: number;
    prerequisiteAward?: string; // id of prerequisite award
  };
  /** Sort order within category (lower = more basic) */
  tier: number;
}

// ==================== AWARD DEFINITIONS ====================

export const AWARDS: AwardDefinition[] = [
  // ——— Voyage Medals (Attending) ———
  {
    id: 'citation-of-voyages',
    name: 'Citation of Voyages',
    category: 'voyage-attending',
    requirements: '5 voyages with no disciplinary issues.',
    responsibleRank: 'E-6',
    autoDetect: true,
    thresholds: { voyages: 5 },
    tier: 1,
  },
  {
    id: 'legion-of-voyages',
    name: 'Legion of Voyages',
    category: 'voyage-attending',
    requirements: 'High activity in squad chats. 25 voyages with no disciplinary issues. Citation of Voyages.',
    responsibleRank: 'E-7',
    autoDetect: true,
    thresholds: { voyages: 25, chatActivityMin: 3, prerequisiteAward: 'citation-of-voyages' },
    tier: 2,
  },
  {
    id: 'honorable-voyager',
    name: 'Honorable Voyager Medal',
    category: 'voyage-attending',
    requirements: 'Attend 50 voyages. Legion of Voyages.',
    responsibleRank: 'O-1',
    autoDetect: true,
    thresholds: { voyages: 50, prerequisiteAward: 'legion-of-voyages' },
    tier: 3,
  },
  {
    id: 'meritorious-voyager',
    name: 'Meritorious Voyager Medal',
    category: 'voyage-attending',
    requirements: 'Attend 100 voyages. Honorable Voyager Medal.',
    responsibleRank: 'O-4',
    autoDetect: true,
    thresholds: { voyages: 100, prerequisiteAward: 'honorable-voyager' },
    tier: 4,
  },
  {
    id: 'admirable-voyager',
    name: 'Admirable Voyager Medal',
    category: 'voyage-attending',
    requirements: 'Attend 200 voyages. Meritorious Voyager Medal.',
    responsibleRank: 'O-7',
    autoDetect: true,
    thresholds: { voyages: 200, prerequisiteAward: 'meritorious-voyager' },
    tier: 5,
  },

  // ——— Voyage Medals (Hosting) ———
  {
    id: 'sea-service-ribbon',
    name: 'Sea Service Ribbon',
    category: 'voyage-hosting',
    requirements: '25 hosted voyages. High activity in squad chats.',
    responsibleRank: 'E-7',
    autoDetect: true,
    thresholds: { hosted: 25, chatActivityMin: 3 },
    tier: 1,
  },
  {
    id: 'maritime-service',
    name: 'Maritime Service Medal',
    category: 'voyage-hosting',
    requirements: '50 hosted voyages. Sea Service Ribbon.',
    responsibleRank: 'O-1',
    autoDetect: true,
    thresholds: { hosted: 50, prerequisiteAward: 'sea-service-ribbon' },
    tier: 2,
  },
  {
    id: 'legendary-service',
    name: 'Legendary Service Medal',
    category: 'voyage-hosting',
    requirements: '100 hosted voyages. Maritime Service Medal.',
    responsibleRank: 'O-4',
    autoDetect: true,
    thresholds: { hosted: 100, prerequisiteAward: 'maritime-service' },
    tier: 3,
  },
  {
    id: 'admirable-service',
    name: 'Admirable Service Medal',
    category: 'voyage-hosting',
    requirements: '200 hosted voyages. Legendary Service Medal.',
    responsibleRank: 'O-7',
    autoDetect: true,
    thresholds: { hosted: 200, prerequisiteAward: 'legendary-service' },
    tier: 4,
  },

  // ——— Voyage Medals (Public Service — Voyage Planning hosted) ———
  {
    id: 'public-service-ribbon',
    name: 'Public Service Ribbon',
    category: 'voyage-public',
    requirements: '10 voyages hosted through Voyage Planning.',
    responsibleRank: 'E-7',
    autoDetect: false,
    tier: 1,
  },
  {
    id: 'maritime-public-service',
    name: 'Maritime Public Service Medal',
    category: 'voyage-public',
    requirements: '25 voyages hosted through Voyage Planning. Public Service Ribbon.',
    responsibleRank: 'O-1',
    autoDetect: false,
    tier: 2,
  },
  {
    id: 'legendary-public-service',
    name: 'Legendary Public Service Medal',
    category: 'voyage-public',
    requirements: '50 voyages hosted through Voyage Planning. Maritime Public Service Medal.',
    responsibleRank: 'O-4',
    autoDetect: false,
    tier: 3,
  },
  {
    id: 'admirable-public-service',
    name: 'Admirable Public Service Medal',
    category: 'voyage-public',
    requirements: '100 voyages hosted through Voyage Planning. Legendary Public Service Medal.',
    responsibleRank: 'O-7',
    autoDetect: false,
    tier: 4,
  },

  // ——— Conduct Medals ———
  {
    id: 'citation-of-conduct',
    name: 'Citation of Conduct',
    category: 'conduct',
    requirements: 'Fair activity in ship chats.',
    responsibleRank: 'E-6',
    autoDetect: true,
    thresholds: { chatActivityMin: 1 },
    tier: 1,
  },
  {
    id: 'legion-of-conduct',
    name: 'Legion of Conduct',
    category: 'conduct',
    requirements: 'Moderate activity in ship chats. Citation of Conduct.',
    responsibleRank: 'E-7',
    autoDetect: true,
    thresholds: { chatActivityMin: 2, prerequisiteAward: 'citation-of-conduct' },
    tier: 2,
  },
  {
    id: 'honorable-conduct',
    name: 'Honorable Conduct Medal',
    category: 'conduct',
    requirements: 'Moderate activity in ship chats. Hosts on average more than the minimum one voyage per two weeks. Moderate activity in an NETC/SPD server. Legion of Conduct.',
    responsibleRank: 'O-1',
    autoDetect: false, // Requires NETC/SPD activity we can't track
    thresholds: { chatActivityMin: 3, prerequisiteAward: 'legion-of-conduct' },
    tier: 3,
  },
  {
    id: 'meritorious-conduct',
    name: 'Meritorious Conduct Medal',
    category: 'conduct',
    requirements: 'High activity in ship chats. High activity in NETC/SPD. Letter of Recommendation from NETC/SPD Head. Honorable Conduct Medal.',
    responsibleRank: 'O-4',
    autoDetect: false,
    tier: 4,
  },
  {
    id: 'admirable-conduct',
    name: 'Admirable Conduct Medal',
    category: 'conduct',
    requirements: 'Incredible activity in ship chats. Incredible activity in NETC/SPD. Meritorious Conduct Medal.',
    responsibleRank: 'O-7',
    autoDetect: false,
    tier: 5,
  },

  // ——— Combat Medals ———
  {
    id: 'citation-of-combat',
    name: 'Citation of Combat',
    category: 'combat',
    requirements: '2 sinks on an official Skirmish.',
    responsibleRank: 'E-6',
    autoDetect: false,
    tier: 1,
  },
  {
    id: 'legion-of-combat',
    name: 'Legion of Combat',
    category: 'combat',
    requirements: '3 win streak on an official Skirmish.',
    responsibleRank: 'E-7',
    autoDetect: false,
    tier: 2,
  },
  {
    id: 'honorable-combat',
    name: 'Honorable Combat Action',
    category: 'combat',
    requirements: '5 win streak on an official Skirmish.',
    responsibleRank: 'O-1',
    autoDetect: false,
    tier: 3,
  },
  {
    id: 'meritorious-combat',
    name: 'Meritorious Combat Action',
    category: 'combat',
    requirements: '7 win streak on an official Skirmish. Must show proof.',
    responsibleRank: 'O-4',
    autoDetect: false,
    tier: 4,
  },
  {
    id: 'admirable-combat',
    name: 'Admirable Combat Action',
    category: 'combat',
    requirements: '10 win streak on an official Skirmish. Must show proof.',
    responsibleRank: 'O-7',
    autoDetect: false,
    tier: 5,
  },

  // ——— Service Stripes ———
  {
    id: 'service-stripe-4',
    name: '4 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 4 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 4 },
    tier: 1,
  },
  {
    id: 'service-stripe-6',
    name: '6 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 6 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 6 },
    tier: 2,
  },
  {
    id: 'service-stripe-8',
    name: '8 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 8 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 8 },
    tier: 3,
  },
  {
    id: 'service-stripe-12',
    name: '12 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 12 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 12 },
    tier: 4,
  },
  {
    id: 'service-stripe-18',
    name: '18 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 18 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 18 },
    tier: 5,
  },
  {
    id: 'service-stripe-24',
    name: '24 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 24 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 24 },
    tier: 6,
  },
  {
    id: 'service-stripe-30',
    name: '30 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 30 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 30 },
    tier: 7,
  },
  {
    id: 'service-stripe-36',
    name: '36 Months Service Stripes',
    category: 'service-stripes',
    requirements: 'Serve 36 months in the Navy.',
    responsibleRank: 'SL/CoS',
    autoDetect: true,
    thresholds: { serviceMonths: 36 },
    tier: 8,
  },

  // ——— Challenge Coins ———
  {
    id: 'challenge-coin',
    name: 'Challenge Coin',
    category: 'challenge-coins',
    requirements: 'Complete a challenge set by a Junior Officer or impress a Junior Officer.',
    responsibleRank: 'O-1',
    autoDetect: false,
    tier: 1,
  },
  {
    id: 'commanders-challenge-coin',
    name: "Commander's Challenge Coin",
    category: 'challenge-coins',
    requirements: 'Complete a challenge set by a Senior Officer or impress a Senior Officer.',
    responsibleRank: 'O-4',
    autoDetect: false,
    tier: 2,
  },

  // ——— Training Ribbons ———
  {
    id: 'honorable-training',
    name: 'Honorable Training Ribbon',
    category: 'training',
    requirements: 'Trained 25 recruits and/or instructed 25 leaders.',
    responsibleRank: 'NRC/NETC',
    autoDetect: false,
    tier: 1,
  },
  {
    id: 'meritorious-training',
    name: 'Meritorious Training Ribbon',
    category: 'training',
    requirements: 'Trained 50 recruits and/or instructed 50 leaders.',
    responsibleRank: 'NRC/NETC',
    autoDetect: false,
    tier: 2,
  },
  {
    id: 'admirable-training',
    name: 'Admirable Training Ribbon',
    category: 'training',
    requirements: 'Trained 100 recruits and/or instructed 100 leaders.',
    responsibleRank: 'NRC/NETC',
    autoDetect: false,
    tier: 3,
  },
  {
    id: 'recruitment-ribbon',
    name: 'Recruitment Ribbon',
    category: 'training',
    requirements: 'Successfully recruited 15 people who have applied and been trained.',
    responsibleRank: 'NRC',
    autoDetect: false,
    tier: 4,
  },

  // ——— Representation Badges ———
  {
    id: 'representation-3rd',
    name: 'Third Class Representation Badge',
    category: 'representation',
    requirements: 'Won or significantly contributed to a qualifying server event or notable impact on official USN media/social media.',
    responsibleRank: 'Scheduling/Media',
    autoDetect: false,
    tier: 1,
  },
  {
    id: 'representation-2nd',
    name: 'Second Class Representation Badge',
    category: 'representation',
    requirements: 'Won or significantly contributed to two qualifying server events or notable impact across multiple media projects.',
    responsibleRank: 'Scheduling/Media',
    autoDetect: false,
    tier: 2,
  },
  {
    id: 'representation-1st',
    name: 'First Class Representation Badge',
    category: 'representation',
    requirements: 'Won or significantly contributed to four qualifying server events or notable impact across multiple media projects.',
    responsibleRank: 'Scheduling/Media',
    autoDetect: false,
    tier: 3,
  },
  {
    id: 'representation-distinguished',
    name: 'Distinguished Representation Badge',
    category: 'representation',
    requirements: 'Won or significantly contributed to six qualifying server events or exceptional long-term media impact.',
    responsibleRank: 'Scheduling/Media',
    autoDetect: false,
    tier: 4,
  },

  // ——— Career / Misc ———
  {
    id: 'nco-improvement',
    name: 'NCO Improvement Ribbon',
    category: 'career',
    requirements: 'NCO has demonstrated knowledge of leadership, the role, and expectations. Required to be promoted past E-4.',
    responsibleRank: 'O-1',
    autoDetect: false,
    tier: 1,
  },
  {
    id: 'officer-improvement',
    name: 'Officer Improvement Ribbon',
    category: 'career',
    requirements: 'Junior Officer has demonstrated they know what it means to be an Officer. Required to be promoted past O-3.',
    responsibleRank: 'CO',
    autoDetect: false,
    tier: 2,
  },
  {
    id: 'career-intelligence',
    name: 'Career Intelligence Medal',
    category: 'career',
    requirements: 'Exceptional achievements that substantially contributed to the mission of Logistics/NSC.',
    responsibleRank: 'Logistics/NSC',
    autoDetect: false,
    tier: 3,
  },
  {
    id: 'unit-commendation',
    name: 'Unit Commendation Medal',
    category: 'career',
    requirements: 'Giving recognition to a unit for strong and lasting contributions.',
    responsibleRank: 'Fleet CO',
    autoDetect: false,
    tier: 4,
  },

  // ——— Other / Special Medals ———
  {
    id: 'leadership-accolade',
    name: 'Leadership Accolade',
    category: 'other',
    requirements: 'When an E-4+ has proven strong leadership and growth.',
    responsibleRank: 'O-1',
    autoDetect: false,
    tier: 1,
  },
  {
    id: 'legion-of-merit',
    name: 'Legion of Merit',
    category: 'other',
    requirements: 'When a member has proven their dedication for the welfare and happiness of their fellow members.',
    responsibleRank: 'E-7',
    autoDetect: false,
    tier: 2,
  },
  {
    id: 'medal-exceptional-service',
    name: 'Medal of Exceptional Service',
    category: 'other',
    requirements: 'Earned through time in service. When a member has been in service for many months they will be recognized.',
    responsibleRank: 'O-1',
    autoDetect: false,
    tier: 3,
  },
  {
    id: 'unit-distinction',
    name: 'Unit Distinction Medal',
    category: 'other',
    requirements: "Awarded to all current sailors on a ship when a ship's guild reaches Distinction 10.",
    responsibleRank: 'O-7',
    autoDetect: false,
    tier: 4,
  },
  {
    id: 'marine-exceptional',
    name: 'Marine Exceptional Service Medal',
    category: 'other',
    requirements: 'Exceptional service within the USMC Committee to continue the USMC legacy.',
    responsibleRank: 'USMC Commandant',
    autoDetect: false,
    tier: 5,
  },
  {
    id: 'distinguished-service-cross',
    name: 'Distinguished Service Cross',
    category: 'other',
    requirements: 'Service and dedication above the call of duty — a lasting impact on the USN of SoT.',
    responsibleRank: 'BOA',
    autoDetect: false,
    tier: 6,
  },
  {
    id: 'valor-and-courage',
    name: 'Valor and Courage',
    category: 'other',
    requirements: 'Bravery in the face of an overwhelming force. Only handed out with permission from the Vice Admiral.',
    responsibleRank: 'O-9',
    autoDetect: false,
    tier: 7,
  },
  {
    id: 'admiralty-medal',
    name: 'Admiralty Medal',
    category: 'other',
    requirements: 'Performed at a level expected of an Admiral, or added to the Admiralty.',
    responsibleRank: 'O-7',
    autoDetect: false,
    tier: 8,
  },
  {
    id: 'medal-of-honor',
    name: 'Medal of Honor',
    category: 'other',
    requirements: 'Act of service to the USN that goes beyond the expectations and service of the average member.',
    responsibleRank: 'O-10',
    autoDetect: false,
    tier: 9,
  },
];

// ==================== SUBCLASS AWARDS ====================
// Listed separately as they have a unique tier structure

export const SUBCLASS_AWARDS: AwardDefinition[] = [
  // Voyage Role Commendations
  { id: 'adept-carpenter',   name: 'Adept Carpenter',   category: 'subclass', requirements: 'Performed Carpenter role to standards on 5 official voyages.', responsibleRank: 'E-6', autoDetect: false, tier: 1 },
  { id: 'adept-flex',        name: 'Adept Flex',        category: 'subclass', requirements: 'Performed Flex role to standards on 5 official voyages.',      responsibleRank: 'E-6', autoDetect: false, tier: 1 },
  { id: 'adept-helm',        name: 'Adept Helm',        category: 'subclass', requirements: 'Performed Helm role to standards on 5 official voyages.',      responsibleRank: 'E-6', autoDetect: false, tier: 1 },
  { id: 'adept-cannoneer',   name: 'Adept Cannoneer',   category: 'subclass', requirements: 'Performed Cannoneer role to standards on 5 official voyages.', responsibleRank: 'E-6', autoDetect: false, tier: 1 },
  { id: 'pro-carpenter',     name: 'Pro Carpenter',     category: 'subclass', requirements: 'Performed Carpenter role to standards on 15 official voyages.', responsibleRank: 'E-6', autoDetect: false, tier: 2 },
  { id: 'pro-flex',          name: 'Pro Flex',          category: 'subclass', requirements: 'Performed Flex role to standards on 15 official voyages.',      responsibleRank: 'E-6', autoDetect: false, tier: 2 },
  { id: 'pro-helm',          name: 'Pro Helm',          category: 'subclass', requirements: 'Performed Helm role to standards on 15 official voyages.',      responsibleRank: 'E-6', autoDetect: false, tier: 2 },
  { id: 'pro-cannoneer',     name: 'Pro Cannoneer',     category: 'subclass', requirements: 'Performed Cannoneer role to standards on 15 official voyages.', responsibleRank: 'E-6', autoDetect: false, tier: 2 },
  { id: 'master-carpenter',  name: 'Master Carpenter',  category: 'subclass', requirements: 'Performed Carpenter role to standards on 25 official voyages.', responsibleRank: 'E-6', autoDetect: false, tier: 3 },
  { id: 'master-flex',       name: 'Master Flex',       category: 'subclass', requirements: 'Performed Flex role to standards on 25 official voyages.',      responsibleRank: 'E-6', autoDetect: false, tier: 3 },
  { id: 'master-helm',       name: 'Master Helm',       category: 'subclass', requirements: 'Performed Helm role to standards on 25 official voyages.',      responsibleRank: 'E-6', autoDetect: false, tier: 3 },
  { id: 'master-cannoneer',  name: 'Master Cannoneer',  category: 'subclass', requirements: 'Performed Cannoneer role to standards on 25 official voyages.', responsibleRank: 'E-6', autoDetect: false, tier: 3 },

  // Special subclasses
  { id: 'legendary-adventurer', name: 'Legendary Adventurer',     category: 'subclass', requirements: 'Earn all Shores of Gold Commendations.',            responsibleRank: 'E-6', autoDetect: false, tier: 4 },
  { id: 'merchant-fisherman',   name: 'Merchant Navy Fisherman', category: 'subclass', requirements: 'Earn all Hunters Call Commendations.',                responsibleRank: 'E-6', autoDetect: false, tier: 4 },
  { id: 'grenadier',            name: 'Grenadier',               category: 'subclass', requirements: 'Sink 10 ships with a keg over Navy career.',          responsibleRank: 'E-6', autoDetect: false, tier: 4 },
  { id: 'field-surgeon',        name: 'Field Surgeon',           category: 'subclass', requirements: 'Exceptional healing/resurrection during 5 official Skirmish Voyages.', responsibleRank: 'E-6', autoDetect: false, tier: 4 },
];

// ==================== HELPERS ====================

/** Category display labels */
export const CATEGORY_LABELS: Record<AwardCategory, string> = {
  'voyage-attending': '⚓ Voyage Medals (Attending)',
  'voyage-hosting': '🚢 Voyage Medals (Hosting)',
  'voyage-public': '📋 Public Service Medals',
  'conduct': '💬 Conduct Medals',
  'combat': '⚔️ Combat Medals',
  'service-stripes': '🎖️ Service Stripes',
  'challenge-coins': '🪙 Challenge Coins',
  'training': '📚 Training Ribbons',
  'representation': '🏅 Representation Badges',
  'subclass': '🎯 Subclasses',
  'career': '📈 Career / Misc',
  'other': '⭐ Other Medals',
};

/** All auto-detectable awards */
export const AUTO_DETECT_AWARDS = AWARDS.filter((a) => a.autoDetect);

/** Get the highest award a sailor qualifies for in a tiered series */
export const getHighestEligibleAward = (
  awards: AwardDefinition[],
  voyages: number,
  hosted: number,
  chatActivity: number,
  serviceMonths: number
): AwardDefinition | null => {
  // Sort by tier descending — check highest first
  const sorted = [...awards].filter((a) => a.autoDetect).sort((a, b) => b.tier - a.tier);
  for (const award of sorted) {
    const t = award.thresholds;
    if (!t) continue;
    let eligible = true;
    if (t.voyages !== undefined && voyages < t.voyages) eligible = false;
    if (t.hosted !== undefined && hosted < t.hosted) eligible = false;
    if (t.chatActivityMin !== undefined && chatActivity < t.chatActivityMin) eligible = false;
    if (t.serviceMonths !== undefined && serviceMonths < t.serviceMonths) eligible = false;
    if (eligible) return award;
  }
  return null;
};
