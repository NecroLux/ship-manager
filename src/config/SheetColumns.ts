/**
 * Sheet Column Mappings
 * Master data source is Gullinbursti (Ancient Isles Fleet Reports)
 * Supplementary sources: LadyHoit's Awards Sheets (Time/Voyage Awards & Role/Coin Awards)
 */

// ==================== GULLINBURSTI SHEET ====================
// Range: Gullinbursti!A8:W49
// Primary source for crew roster, compliance, activity, and leadership notes

export const GULLINBURSTI_COLUMNS = {
  // Core Identity
  RANK: 0,                          // Rank code (E-2, E-6, O-1, etc.)
  NAME: 1,                          // Sailor full name
  DISCORD_USERNAME: 2,              // Discord username
  
  // Guild & Game Info
  IN_GUILD_INDICATOR: 3,            // Are they in the in-game guild?
  GAMERTAG_INDICATOR: 4,            // Is their gamertag added?
  GAMERTAG_XBOX: 5,                 // Xbox gamertag (optional noise)
  TIMEZONE_INDICATOR: 6,            // Is timezone added?
  
  // Location & Status
  TIMEZONE: 7,                      // Timezone (EST, PST, etc.)
  LOA_STATUS: 8,                    // On Leave of Absence (LOA)?
  LOA_RETURN_DATE: 9,               // When do they plan to return from LOA?
  
  // Activity
  CHAT_ACTIVITY: 10,                // Chat activity (stars/rating)
  SAILING_COMPLIANCE: 11,           // Within sailing regulations (1 voyage/month minimum)
  HOSTING_COMPLIANCE: 12,           // Within hosting regulations (1 host/fortnight for JPO+, N/A for Able/Seaman)
  
  // Leadership Comments (for Actions generation)
  SQUAD_LEADER_COMMENTS: 13,        // Squad leader notes (parse for actions)
  
  // Personal Info
  BIRTHDAY: 14,                     // Birthday (Day/Month only, no year)
  SPACER: 15,                       // Spacer column (ignore)
  
  // Game/Service Info
  DISCORD_ID: 16,                   // Discord user ID (irrelevant for tool)
  SPD_INDICATOR: 17,                // Are they in a Special Project Division?
  SPD_NAME: 18,                     // Which SPD are they in? (reference)
  
  // Service & Promotion
  SERVICE_STRIPE: 19,               // Do they have a service stripe for active time?
  SERVICE_STRIPE_CORRECT: 20,       // Is their service stripe correct?
  PROMOTION_ELIGIBLE: 21,           // Are they eligible for promotion? (manual box)
  
  // Additional Leadership Notes
  COS_NOTES: 22,                    // Chief of Ship notes (parse for actions)
} as const;

// ==================== TIME/VOYAGE AWARDS SHEET ====================
// Range: Time/Voyage Awards!A1:AH34
// Supplementary source for sailing activity, host counts, voyage counts, award status
// Note: Contains duplicate info from Gullinbursti (name, discord, rank, timezone)

export const VOYAGE_AWARDS_COLUMNS = {
  // Role & Identity (duplicates Gullinbursti)
  ROLE: 0,                          // Role (CO, FO, COS, Squad Leader, Squad XO) or Squad name
  NAME: 1,                          // Sailor name
  DISCORD_ID: 2,                    // Discord ID
  FO_NOTES: 3,                      // First Officer notes (complex to translate)
  DISCORD_USERNAME: 4,              // Discord username
  
  // Guild & Rank
  IN_GUILD: 5,                      // Are they in in-game guild?
  RANK: 6,                          // Rank code (E-6, O-4, etc.)
  
  // Location & Service
  TIMEZONE: 7,                      // Timezone
  JOIN_DATE: 8,                     // Join date (server, not necessarily ship)
  
  // Activity Metrics
  DAYS_INACTIVE: 9,                 // Days since last voyage
  LAST_HOST_DATE: 10,               // Last date they hosted (blank for Able/Seaman)
  HOST_COUNT: 11,                   // How many times they've hosted
  LAST_VOYAGE_DATE: 12,             // Last official voyage attended
  TOTAL_VOYAGES: 13,                // Total official voyages attended
  
  // Award Status (columns O-AG)
  // These columns track award eligibility/status for each medal type
  // Header values will be medal names from NavalConfig
  AWARDS_START: 14,                 // Awards columns begin at index 14 (O in Excel)
  BIRTHDAY: 33,                     // AH = Birthday
} as const;

// ==================== ROLE/COIN AWARDS SHEET ====================
// Range: Role/Coin Awards!A1:O34
// Supplementary source for subclass progression, special achievements, challenge coins
// Note: Different structure from Voyage Awards - tracks subclass mastery and special awards

export const ROLE_COIN_COLUMNS = {
  // Role & Identity
  ROLE: 0,                          // Role (CO, FO, COS, Squad Leader, Squad XO) or Squad name
  NAME: 1,                          // Sailor name
  FO_NOTES: 2,                      // First Officer notes
  
  // Voyage Summary
  TOTAL_VOYAGES: 3,                 // Total number of voyages
  UNACCOUNTED_SUBCLASS: 4,          // Voyages where subclass not recorded
  
  // Subclass Progression (Award Tiers: 5=Adept, 15=Pro, 25=Master)
  CARPENTER: 5,                     // Carpenter voyages (Carp/Bilge)
  FLEX: 6,                          // Flex voyages (Flex)
  CANNONEER: 7,                     // Cannoneer voyages (Cannons/Guns)
  HELM: 8,                          // Helm voyages (Wheel/Helmsman)
  
  // Special Achievement Points
  GRENADIER_POINTS: 9,              // Grenadier points (sank ship with keg)
  FIELD_SURGEON_POINTS: 10,         // Field Surgeon points (revived 3+ teammates in skirmish)
  
  // Special Achievements
  PIRATE_LEGEND: 11,                // Pirate Legend in-game status
  COMMANDER_CHALLENGE_COIN: 12,     // Earned commander's challenge coin?
  OFFICER_CHALLENGE_COIN: 13,       // Earned officer's challenge coin?
} as const;

// ==================== COMPLIANCE RULES ====================
// Business logic for crew compliance based on rank and regulations

export const COMPLIANCE_RULES = {
  // Sailing Requirements (from GULLINBURSTI_COLUMNS.SAILING_COMPLIANCE)
  SAILING_MINIMUM_VOYAGES_PER_MONTH: 1,
  SAILING_APPLIES_TO: ['E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'],
  
  // Hosting Requirements (from GULLINBURSTI_COLUMNS.HOSTING_COMPLIANCE)
  HOSTING_MINIMUM_PER_FORTNIGHT: 1,
  HOSTING_APPLIES_TO: ['E-6', 'E-7', 'E-8', 'O-1', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'], // Junior Petty Officer and above
  HOSTING_NOT_APPLIES_TO: ['E-2', 'E-3', 'E-4', 'E-5'], // Able & Seaman cannot host
} as const;

// ==================== SPECIAL CASES ====================

export const SPECIAL_COLUMN_RULES = {
  // LOA (Leave of Absence) handling
  // If sailor is on LOA, they are exempt from compliance checks
  // Check GULLINBURSTI_COLUMNS.LOA_STATUS and LOA_RETURN_DATE
  
  // SPD (Special Project Division) eligibility
  // Some ranks/promotions require SPD participation
  // Check GULLINBURSTI_COLUMNS.SPD_INDICATOR and SPD_NAME
  
  // Service Stripes
  // Requires checking join date (VOYAGE_AWARDS_COLUMNS.JOIN_DATE)
  // and service history (inactive/LOA periods)
  // Verify against COS before awarding
  
  // Promotion Eligibility
  // Use GULLINBURSTI_COLUMNS.PROMOTION_ELIGIBLE as override
  // But compute eligibility based on medals, service time, performance
  
  // Guild Indicator
  // GULLINBURSTI_COLUMNS.IN_GUILD_INDICATOR
  // If false, create action: Medium - Add to In-Game Guild - Squad Leader
  
  // Birthday MOTD
  // Check GULLINBURSTI_COLUMNS.BIRTHDAY for upcoming birthdays
  // Create low-priority MOTD actions
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Get a sailor's name from either sheet
 */
export const getSailorName = (row: Record<string, string>, sheetType: 'gullinbursti' | 'voyage' | 'role-coin'): string => {
  const nameIndex = sheetType === 'gullinbursti' ? GULLINBURSTI_COLUMNS.NAME : VOYAGE_AWARDS_COLUMNS.NAME;
  return (row[nameIndex] || '').trim();
};

/**
 * Check if a sailor is on LOA
 */
export const isOnLOA = (row: Record<string, string>): boolean => {
  const loaStatus = (row[GULLINBURSTI_COLUMNS.LOA_STATUS] || '').toLowerCase().trim();
  return loaStatus.includes('yes') || loaStatus.includes('loa') || loaStatus.includes('true');
};

/**
 * Check if a sailor should be hosting based on rank
 */
export const canHost = (rankCode: string): boolean => {
  return (COMPLIANCE_RULES.HOSTING_APPLIES_TO as readonly string[]).includes(rankCode);
};

/**
 * Check if a sailor must sail based on rank
 */
export const mustSail = (rankCode: string): boolean => {
  return (COMPLIANCE_RULES.SAILING_APPLIES_TO as readonly string[]).includes(rankCode);
};

export default {
  GULLINBURSTI_COLUMNS,
  VOYAGE_AWARDS_COLUMNS,
  ROLE_COIN_COLUMNS,
  COMPLIANCE_RULES,
  SPECIAL_COLUMN_RULES,
};
