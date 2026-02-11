/**
 * USN Promotion Prerequisites Configuration.
 *
 * Each entry defines what's needed to promote FROM the current rank to the next.
 * Auto-detectable criteria are marked; manual criteria need human verification.
 */

// ==================== TYPES ====================

export interface PromotionPrerequisite {
  id: string;
  label: string;
  /** Can we auto-detect this from sheet data? */
  autoDetect: boolean;
  /** Threshold for auto-detection */
  threshold?: {
    voyages?: number;
    hosted?: number;
    chatActivityMin?: number; // 0-5 scale
    serviceMonths?: number;
  };
}

export interface PromotionPath {
  /** Current rank code */
  fromRank: string;
  /** Next rank code */
  toRank: string;
  /** Human-readable label */
  label: string;  // e.g. "E-2 → E-3"
  /** Who approves this promotion */
  responsibleRank: string;
  /** Prerequisites checklist */
  prerequisites: PromotionPrerequisite[];
}

// ==================== PROMOTION PATHS ====================

export const PROMOTION_PATHS: PromotionPath[] = [
  {
    fromRank: 'E-2',
    toRank: 'E-3',
    label: 'Seaman → Able Seaman',
    responsibleRank: 'SL',
    prerequisites: [
      { id: 'e3-voyages', label: 'Attend 5 official voyages', autoDetect: true, threshold: { voyages: 5 } },
      { id: 'e3-chat', label: 'Decent activity in squad chat', autoDetect: true, threshold: { chatActivityMin: 1 } },
      { id: 'e3-medal', label: 'Citation of Combat OR Citation of Conduct', autoDetect: false },
    ],
  },
  {
    fromRank: 'E-3',
    toRank: 'E-4',
    label: 'Able Seaman → Junior Petty Officer',
    responsibleRank: 'SL',
    prerequisites: [
      { id: 'e4-2fa', label: '2FA enabled', autoDetect: false },
      { id: 'e4-jla', label: 'JLA completed', autoDetect: false },
      { id: 'e4-voyages', label: '15 voyages + 2 weeks as E-3 (or 20 voyages + 1 week)', autoDetect: true, threshold: { voyages: 15 } },
      { id: 'e4-conduct', label: 'Citation of Conduct', autoDetect: false },
    ],
  },
  {
    fromRank: 'E-4',
    toRank: 'E-6',
    label: 'Junior Petty Officer → Petty Officer',
    responsibleRank: 'CoS',
    prerequisites: [
      { id: 'e6-hosted', label: '10 hosted voyages', autoDetect: true, threshold: { hosted: 10 } },
      { id: 'e6-spd', label: 'Join an SPD or be a Squad Leader', autoDetect: false },
      { id: 'e6-time', label: 'E-4 for 2 weeks', autoDetect: false },
    ],
  },
  {
    fromRank: 'E-6',
    toRank: 'E-7',
    label: 'Petty Officer → Chief Petty Officer',
    responsibleRank: 'CO',
    prerequisites: [
      { id: 'e7-hosted', label: '20 hosted voyages as Squad Leader', autoDetect: true, threshold: { hosted: 20 } },
      { id: 'e7-time', label: '1 month as Squad Leader', autoDetect: false },
      { id: 'e7-snla', label: 'SNLA complete', autoDetect: false },
      { id: 'e7-board', label: 'SNCO board passed', autoDetect: false },
    ],
  },
  {
    fromRank: 'E-7',
    toRank: 'E-8',
    label: 'Chief Petty Officer → Senior Chief Petty Officer',
    responsibleRank: 'CO',
    prerequisites: [
      { id: 'e8-service', label: '4 months service stripes', autoDetect: true, threshold: { serviceMonths: 4 } },
      { id: 'e8-conduct', label: 'Honorable Conduct Medal', autoDetect: false },
      { id: 'e8-time', label: '1 month as E-6 or E-7', autoDetect: false },
    ],
  },
  {
    fromRank: 'E-8',
    toRank: 'O-1',
    label: 'Senior Chief Petty Officer → Midshipman',
    responsibleRank: 'BOA',
    prerequisites: [
      { id: 'o1-board', label: 'Officer Board passed', autoDetect: false },
      { id: 'o1-hosted', label: '35 hosted voyages', autoDetect: true, threshold: { hosted: 35 } },
      { id: 'o1-conduct', label: 'Honorable Conduct Medal', autoDetect: false },
      { id: 'o1-service', label: '4 months service stripe', autoDetect: true, threshold: { serviceMonths: 4 } },
      { id: 'o1-rank', label: 'Be E-7 or E-8', autoDetect: true },
    ],
  },
  {
    fromRank: 'O-1',
    toRank: 'O-3',
    label: 'Midshipman → Lieutenant',
    responsibleRank: 'CO',
    prerequisites: [
      { id: 'o3-ocs', label: 'OCS completed', autoDetect: false },
      { id: 'o3-time', label: '2 weeks as O-1', autoDetect: false },
    ],
  },
  {
    fromRank: 'O-3',
    toRank: 'O-4',
    label: 'Lieutenant → Lieutenant Commander',
    responsibleRank: 'BOA',
    prerequisites: [
      { id: 'o4-socs', label: 'SOCS completed', autoDetect: false },
      { id: 'o4-vote', label: 'Voted on by Board of Admiralty', autoDetect: false },
    ],
  },
  {
    fromRank: 'O-4',
    toRank: 'O-5',
    label: 'Lieutenant Commander → Commander',
    responsibleRank: 'Fleet',
    prerequisites: [
      { id: 'o5-time', label: '4 weeks as O-4', autoDetect: false },
      { id: 'o5-recruit', label: 'Recruit and maintain 4 external members on ship', autoDetect: false },
      { id: 'o5-coc', label: 'Functional Chain of Command on ship', autoDetect: false },
    ],
  },
  {
    fromRank: 'O-5',
    toRank: 'O-6',
    label: 'Commander → Captain',
    responsibleRank: 'Fleet',
    prerequisites: [
      { id: 'o6-time', label: 'O-5 for 3 months', autoDetect: false },
      { id: 'o6-maritime', label: 'Maritime Service Medal', autoDetect: true, threshold: { hosted: 50 } },
      { id: 'o6-coc', label: 'Full Chain of Command (CoS optional)', autoDetect: false },
    ],
  },
];

// ==================== HELPERS ====================

/**
 * Find the promotion path for a given rank code.
 */
export const getPromotionPathForRank = (rankCode: string): PromotionPath | undefined => {
  return PROMOTION_PATHS.find((p) => p.fromRank === rankCode);
};

/**
 * Check how many auto-detectable prerequisites are met.
 */
export const checkAutoPrereqs = (
  path: PromotionPath,
  voyages: number,
  hosted: number,
  chatActivity: number,
  serviceMonths: number,
): { met: number; total: number; details: Record<string, boolean> } => {
  const details: Record<string, boolean> = {};
  let met = 0;
  const autoPrereqs = path.prerequisites.filter((p) => p.autoDetect);

  autoPrereqs.forEach((p) => {
    let passed = true;
    if (p.threshold) {
      if (p.threshold.voyages !== undefined && voyages < p.threshold.voyages) passed = false;
      if (p.threshold.hosted !== undefined && hosted < p.threshold.hosted) passed = false;
      if (p.threshold.chatActivityMin !== undefined && chatActivity < p.threshold.chatActivityMin) passed = false;
      if (p.threshold.serviceMonths !== undefined && serviceMonths < p.threshold.serviceMonths) passed = false;
    }
    details[p.id] = passed;
    if (passed) met++;
  });

  return { met, total: autoPrereqs.length, details };
};
