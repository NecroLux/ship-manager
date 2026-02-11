/**
 * Pre-confirmed awards for all crew members.
 * Sourced from Paul bot award dump on 2026-02-11.
 *
 * Format: award ID (matching AwardsConfig.ts) → sailor name (matching sheet Name column).
 * These are merged with localStorage so confirmed awards show as "Done" in the Awards tab.
 */

export interface KnownAwardEntry {
  awardId: string;
  sailorName: string;
}

/**
 * All confirmed awards as of 2026-02-11.
 * Includes auto-detected AND manual award types.
 */
export const KNOWN_AWARDS: KnownAwardEntry[] = [
  // ═══════════ Cartel ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Cartel' },
  { awardId: 'citation-of-voyages', sailorName: 'Cartel' },

  // ═══════════ Hoit ═══════════
  { awardId: 'meritorious-conduct', sailorName: 'Hoit' },
  { awardId: 'maritime-service', sailorName: 'Hoit' },
  { awardId: 'admirable-voyager', sailorName: 'Hoit' },
  { awardId: 'admirable-combat', sailorName: 'Hoit' },
  { awardId: 'representation-2nd', sailorName: 'Hoit' },
  { awardId: 'service-stripe-12', sailorName: 'Hoit' },
  { awardId: 'nco-improvement', sailorName: 'Hoit' },
  { awardId: 'leadership-accolade', sailorName: 'Hoit' },
  // Implied lower tiers
  { awardId: 'citation-of-conduct', sailorName: 'Hoit' },
  { awardId: 'legion-of-conduct', sailorName: 'Hoit' },
  { awardId: 'honorable-conduct', sailorName: 'Hoit' },
  { awardId: 'citation-of-voyages', sailorName: 'Hoit' },
  { awardId: 'legion-of-voyages', sailorName: 'Hoit' },
  { awardId: 'honorable-voyager', sailorName: 'Hoit' },
  { awardId: 'meritorious-voyager', sailorName: 'Hoit' },
  { awardId: 'sea-service-ribbon', sailorName: 'Hoit' },
  { awardId: 'service-stripe-4', sailorName: 'Hoit' },
  { awardId: 'service-stripe-6', sailorName: 'Hoit' },
  { awardId: 'service-stripe-8', sailorName: 'Hoit' },
  { awardId: 'representation-3rd', sailorName: 'Hoit' },

  // ═══════════ Levi ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Levi' },
  { awardId: 'honorable-voyager', sailorName: 'Levi' },
  { awardId: 'honorable-combat', sailorName: 'Levi' },
  { awardId: 'nco-improvement', sailorName: 'Levi' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Levi' },
  { awardId: 'legion-of-voyages', sailorName: 'Levi' },

  // ═══════════ Piano ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Piano' },
  { awardId: 'honorable-voyager', sailorName: 'Piano' },
  { awardId: 'honorable-combat', sailorName: 'Piano' },
  { awardId: 'service-stripe-8', sailorName: 'Piano' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Piano' },
  { awardId: 'legion-of-voyages', sailorName: 'Piano' },
  { awardId: 'service-stripe-4', sailorName: 'Piano' },
  { awardId: 'service-stripe-6', sailorName: 'Piano' },

  // ═══════════ Wolfee ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Wolfee' },
  { awardId: 'legion-of-voyages', sailorName: 'Wolfee' },
  { awardId: 'citation-of-combat', sailorName: 'Wolfee' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Wolfee' },

  // ═══════════ Lime ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Lime' },
  { awardId: 'citation-of-voyages', sailorName: 'Lime' },
  { awardId: 'citation-of-combat', sailorName: 'Lime' },

  // ═══════════ ReV ═══════════
  { awardId: 'legion-of-conduct', sailorName: 'ReV' },
  { awardId: 'legion-of-voyages', sailorName: 'ReV' },
  { awardId: 'representation-2nd', sailorName: 'ReV' },
  { awardId: 'service-stripe-4', sailorName: 'ReV' },
  // Implied lower tiers
  { awardId: 'citation-of-conduct', sailorName: 'ReV' },
  { awardId: 'citation-of-voyages', sailorName: 'ReV' },
  { awardId: 'representation-3rd', sailorName: 'ReV' },

  // ═══════════ LadyHoit ═══════════
  { awardId: 'meritorious-conduct', sailorName: 'LadyHoit' },
  { awardId: 'maritime-service', sailorName: 'LadyHoit' },
  { awardId: 'admirable-voyager', sailorName: 'LadyHoit' },
  { awardId: 'admirable-combat', sailorName: 'LadyHoit' },
  { awardId: 'meritorious-training', sailorName: 'LadyHoit' },
  { awardId: 'representation-3rd', sailorName: 'LadyHoit' },
  { awardId: 'service-stripe-12', sailorName: 'LadyHoit' },
  { awardId: 'nco-improvement', sailorName: 'LadyHoit' },
  // Implied lower tiers
  { awardId: 'citation-of-conduct', sailorName: 'LadyHoit' },
  { awardId: 'legion-of-conduct', sailorName: 'LadyHoit' },
  { awardId: 'honorable-conduct', sailorName: 'LadyHoit' },
  { awardId: 'citation-of-voyages', sailorName: 'LadyHoit' },
  { awardId: 'legion-of-voyages', sailorName: 'LadyHoit' },
  { awardId: 'honorable-voyager', sailorName: 'LadyHoit' },
  { awardId: 'meritorious-voyager', sailorName: 'LadyHoit' },
  { awardId: 'sea-service-ribbon', sailorName: 'LadyHoit' },
  { awardId: 'service-stripe-4', sailorName: 'LadyHoit' },
  { awardId: 'service-stripe-6', sailorName: 'LadyHoit' },
  { awardId: 'service-stripe-8', sailorName: 'LadyHoit' },

  // ═══════════ SpaghettiStrudel ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'SpaghettiStrudel' },
  { awardId: 'honorable-voyager', sailorName: 'SpaghettiStrudel' },
  { awardId: 'representation-3rd', sailorName: 'SpaghettiStrudel' },
  { awardId: 'service-stripe-6', sailorName: 'SpaghettiStrudel' },
  { awardId: 'nco-improvement', sailorName: 'SpaghettiStrudel' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'SpaghettiStrudel' },
  { awardId: 'legion-of-voyages', sailorName: 'SpaghettiStrudel' },
  { awardId: 'service-stripe-4', sailorName: 'SpaghettiStrudel' },

  // ═══════════ Zak ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Zak' },
  { awardId: 'legion-of-voyages', sailorName: 'Zak' },
  { awardId: 'service-stripe-4', sailorName: 'Zak' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Zak' },

  // ═══════════ Spice ═══════════
  { awardId: 'honorable-conduct', sailorName: 'Spice' },
  { awardId: 'maritime-service', sailorName: 'Spice' },
  { awardId: 'meritorious-voyager', sailorName: 'Spice' },
  { awardId: 'honorable-combat', sailorName: 'Spice' },
  { awardId: 'representation-3rd', sailorName: 'Spice' },
  { awardId: 'service-stripe-12', sailorName: 'Spice' },
  { awardId: 'nco-improvement', sailorName: 'Spice' },
  // Implied lower tiers
  { awardId: 'citation-of-conduct', sailorName: 'Spice' },
  { awardId: 'legion-of-conduct', sailorName: 'Spice' },
  { awardId: 'citation-of-voyages', sailorName: 'Spice' },
  { awardId: 'legion-of-voyages', sailorName: 'Spice' },
  { awardId: 'honorable-voyager', sailorName: 'Spice' },
  { awardId: 'sea-service-ribbon', sailorName: 'Spice' },
  { awardId: 'service-stripe-4', sailorName: 'Spice' },
  { awardId: 'service-stripe-6', sailorName: 'Spice' },
  { awardId: 'service-stripe-8', sailorName: 'Spice' },

  // ═══════════ Ten ═══════════
  { awardId: 'citation-of-voyages', sailorName: 'Ten' },

  // ═══════════ EIGHT ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'EIGHT' },
  { awardId: 'citation-of-voyages', sailorName: 'EIGHT' },
  { awardId: 'citation-of-combat', sailorName: 'EIGHT' },
  { awardId: 'representation-3rd', sailorName: 'EIGHT' },
  { awardId: 'service-stripe-8', sailorName: 'EIGHT' },
  // Implied lower tiers
  { awardId: 'service-stripe-4', sailorName: 'EIGHT' },
  { awardId: 'service-stripe-6', sailorName: 'EIGHT' },

  // ═══════════ Diggity ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Diggity' },
  { awardId: 'honorable-voyager', sailorName: 'Diggity' },
  { awardId: 'honorable-combat', sailorName: 'Diggity' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Diggity' },
  { awardId: 'legion-of-voyages', sailorName: 'Diggity' },

  // ═══════════ Rimuru ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Rimuru' },
  { awardId: 'legion-of-voyages', sailorName: 'Rimuru' },
  { awardId: 'legion-of-combat', sailorName: 'Rimuru' },
  { awardId: 'service-stripe-6', sailorName: 'Rimuru' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Rimuru' },
  { awardId: 'service-stripe-4', sailorName: 'Rimuru' },

  // ═══════════ SEVEN ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'SEVEN' },
  { awardId: 'honorable-voyager', sailorName: 'SEVEN' },
  { awardId: 'citation-of-combat', sailorName: 'SEVEN' },
  { awardId: 'representation-3rd', sailorName: 'SEVEN' },
  { awardId: 'service-stripe-6', sailorName: 'SEVEN' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'SEVEN' },
  { awardId: 'legion-of-voyages', sailorName: 'SEVEN' },
  { awardId: 'service-stripe-4', sailorName: 'SEVEN' },

  // ═══════════ Bulla ═══════════
  { awardId: 'citation-of-voyages', sailorName: 'Bulla' },

  // ═══════════ NINE ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'NINE' },
  { awardId: 'sea-service-ribbon', sailorName: 'NINE' },
  { awardId: 'honorable-voyager', sailorName: 'NINE' },
  { awardId: 'citation-of-combat', sailorName: 'NINE' },
  { awardId: 'representation-3rd', sailorName: 'NINE' },
  { awardId: 'service-stripe-8', sailorName: 'NINE' },
  { awardId: 'nco-improvement', sailorName: 'NINE' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'NINE' },
  { awardId: 'legion-of-voyages', sailorName: 'NINE' },
  { awardId: 'service-stripe-4', sailorName: 'NINE' },
  { awardId: 'service-stripe-6', sailorName: 'NINE' },

  // ═══════════ Nat ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Nat' },
  { awardId: 'citation-of-voyages', sailorName: 'Nat' },
  { awardId: 'citation-of-combat', sailorName: 'Nat' },

  // ═══════════ Chevy ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Chevy' },
  { awardId: 'legion-of-voyages', sailorName: 'Chevy' },
  { awardId: 'admirable-combat', sailorName: 'Chevy' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Chevy' },

  // ═══════════ Buckey ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Buckey' },
  { awardId: 'citation-of-voyages', sailorName: 'Buckey' },
  { awardId: 'legion-of-combat', sailorName: 'Buckey' },
  { awardId: 'representation-3rd', sailorName: 'Buckey' },
  { awardId: 'service-stripe-4', sailorName: 'Buckey' },

  // ═══════════ Shade ═══════════
  { awardId: 'legion-of-conduct', sailorName: 'Shade' },
  { awardId: 'sea-service-ribbon', sailorName: 'Shade' },
  { awardId: 'meritorious-voyager', sailorName: 'Shade' },
  { awardId: 'honorable-combat', sailorName: 'Shade' },
  { awardId: 'representation-2nd', sailorName: 'Shade' },
  { awardId: 'service-stripe-4', sailorName: 'Shade' },
  { awardId: 'nco-improvement', sailorName: 'Shade' },
  // Implied lower tiers
  { awardId: 'citation-of-conduct', sailorName: 'Shade' },
  { awardId: 'citation-of-voyages', sailorName: 'Shade' },
  { awardId: 'legion-of-voyages', sailorName: 'Shade' },
  { awardId: 'honorable-voyager', sailorName: 'Shade' },
  { awardId: 'representation-3rd', sailorName: 'Shade' },

  // ═══════════ Krimson ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Krimson' },
  { awardId: 'legion-of-voyages', sailorName: 'Krimson' },
  { awardId: 'legion-of-combat', sailorName: 'Krimson' },
  { awardId: 'representation-3rd', sailorName: 'Krimson' },
  { awardId: 'service-stripe-4', sailorName: 'Krimson' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Krimson' },

  // ═══════════ Rain ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Rain' },
  { awardId: 'legion-of-voyages', sailorName: 'Rain' },
  { awardId: 'legion-of-combat', sailorName: 'Rain' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Rain' },

  // ═══════════ Bean ═══════════
  // None

  // ═══════════ Mystiqish ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Mystiqish' },
  { awardId: 'honorable-voyager', sailorName: 'Mystiqish' },
  { awardId: 'admirable-combat', sailorName: 'Mystiqish' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Mystiqish' },
  { awardId: 'legion-of-voyages', sailorName: 'Mystiqish' },

  // ═══════════ Necro ═══════════
  { awardId: 'citation-of-conduct', sailorName: 'Necro' },
  { awardId: 'sea-service-ribbon', sailorName: 'Necro' },
  { awardId: 'honorable-voyager', sailorName: 'Necro' },
  { awardId: 'legion-of-combat', sailorName: 'Necro' },
  { awardId: 'representation-3rd', sailorName: 'Necro' },
  // Implied lower tiers
  { awardId: 'citation-of-voyages', sailorName: 'Necro' },
  { awardId: 'legion-of-voyages', sailorName: 'Necro' },
];

/**
 * Build a Set of `awardId::sailorName` keys for fast lookup.
 * Uses case-insensitive sailor name matching.
 */
export const buildKnownAwardsSet = (): Set<string> => {
  const set = new Set<string>();
  KNOWN_AWARDS.forEach(({ awardId, sailorName }) => {
    set.add(`${awardId}::${sailorName}`);
  });
  return set;
};

/**
 * Check if an award is confirmed for a sailor.
 * Does case-insensitive name matching.
 */
export const isKnownAwarded = (
  knownSet: Set<string>,
  awardId: string,
  sailorName: string
): boolean => {
  // Direct match
  if (knownSet.has(`${awardId}::${sailorName}`)) return true;
  // Case-insensitive fallback
  const lowerName = sailorName.toLowerCase();
  for (const key of knownSet) {
    const [id, name] = key.split('::');
    if (id === awardId && name.toLowerCase() === lowerName) return true;
  }
  return false;
};
