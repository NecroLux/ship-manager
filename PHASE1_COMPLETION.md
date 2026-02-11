# Data Health Infrastructure - Implementation Summary

## ✅ Phase 1 Complete: Sheet Mapping & Config

### What Was Created

#### 1. **`src/config/SheetColumns.ts`** (commit 6cc14d8)
Complete column mapping for all three sheets:

```typescript
// Gullinbursti (23 columns)
RANK, NAME, DISCORD_USERNAME, IN_GUILD_INDICATOR, GAMERTAG_INDICATOR, GAMERTAG_XBOX,
TIMEZONE_INDICATOR, TIMEZONE, LOA_STATUS, LOA_RETURN_DATE, CHAT_ACTIVITY,
SAILING_COMPLIANCE, HOSTING_COMPLIANCE, SQUAD_LEADER_COMMENTS, BIRTHDAY, SPACER,
DISCORD_ID, SPD_INDICATOR, SPD_NAME, SERVICE_STRIPE, SERVICE_STRIPE_CORRECT,
PROMOTION_ELIGIBLE, COS_NOTES

// Voyage Awards (14+ columns)
ROLE, NAME, DISCORD_ID, FO_NOTES, DISCORD_USERNAME, IN_GUILD, RANK, TIMEZONE,
JOIN_DATE, DAYS_INACTIVE, LAST_HOST_DATE, HOST_COUNT, LAST_VOYAGE_DATE,
TOTAL_VOYAGES, [AWARDS_O-AG], BIRTHDAY

// Role/Coin Awards (14 columns)
ROLE, NAME, FO_NOTES, TOTAL_VOYAGES, UNACCOUNTED_SUBCLASS,
CARPENTER, FLEX, CANNONEER, HELM, GRENADIER_POINTS, FIELD_SURGEON_POINTS,
PIRATE_LEGEND, COMMANDER_CHALLENGE_COIN, OFFICER_CHALLENGE_COIN
```

**Helper Functions Included:**
- `isOnLOA(row)` - Check if sailor is on leave
- `canHost(rank)` - Verify rank can host (JPO+)
- `mustSail(rank)` - Verify rank must sail

---

#### 2. **`src/services/dataParser.ts`** (commit 6cc14d8)
Type-safe data normalization service:

```typescript
// Typed Interfaces
ParsedCrewMember {
  rank, name, discordUsername, squad, timezone, loaStatus, chatActivity,
  sailingCompliant, hostingCompliant, canHostRank, mustSailRank,
  squadLeaderComments, cosNotes, birthday, spd, serviceStripe,
  serviceStripeCorrect, promotionEligible
}

ParsedLeaderboardEntry {
  name, rank, role, joinDate, lastVoyageDate, voyageCount, hostCount,
  daysInactive, timezone, inGuild
}

ParsedSubclassProgress {
  name, totalVoyages, carpenter, flex, cannoneer, helm, grenadierPoints,
  fieldSurgeonPoints, isPirateLegend, hasCommanderCoin, hasOfficerCoin
}
```

**Functions:**
- `parseAllCrewMembers(rows)` → ParsedCrewMember[]
- `parseAllLeaderboardEntries(rows)` → ParsedLeaderboardEntry[]
- `parseAllSubclassProgress(rows)` → ParsedSubclassProgress[]
- `enrichCrewWithLeaderboardData(crew, leaderboard)` → Combined data
- `getTopHosts(leaderboardData, limit)` → Top hosts sorted
- `getTopVoyagers(leaderboardData, limit)` → Top voyagers sorted

---

#### 3. **`DATA_HEALTH_AUDIT.md`** (commit 6cc14d8)
Comprehensive audit documenting:
- Current data capture gaps
- Data flow problems
- Recommended solutions
- Impact summary

---

## 🎯 Key Improvements

### Before (Current Codebase)
```typescript
// Magic indices scattered throughout code
const rank = row[headers[0]];
const name = row[headers[1]];
const timezone = row[headers[7]];
const compliance = row[headers[8]];
const stars = row[headers[10]];

// Each component independently parses
// Duplicated logic in UsersTab, ActionsTab, OverviewTab, ReportsTab
```

### After (With New Infrastructure)
```typescript
// Single source of truth
import { GULLINBURSTI_COLUMNS } from '@config/SheetColumns';
import { parseAllCrewMembers } from '@services/dataParser';

const crew = parseAllCrewMembers(rawRows);
// TypeScript validates all fields
const member: ParsedCrewMember = crew[0];
console.log(member.sailingCompliant); // ✓ Type-safe
```

---

## 📋 What's Next (Phase 2)

### Step 1: Refactor UsersTab
Replace manual parsing:
```typescript
// OLD
for (let i = 0; i < data.gullinbursti.rows.length; i++) {
  const rank = row[headers[0]];
  const name = row[headers[1]];
  // ... 10+ more manual extractions
}

// NEW
const crew = parseAllCrewMembers(data.gullinbursti.rows);
crew.forEach(member => {
  console.log(member.rank, member.name);
});
```

### Step 2: Implement Staff Comment Action Generation
```typescript
// Parse COS and Squad Leader comments
const cosComments = member.cosNotes || '';
if (cosComments.toLowerCase().includes('deckhand')) {
  actions.push({
    type: 'deckhand-action',
    sailor: member.name,
    responsible: 'Chief of Ship / Command',
    severity: 'high',
    deadline: extractDeadlineFromComment(cosComments),
  });
}
```

### Step 3: Fix Overview Tab Data Source
Replace direct sheet access:
```typescript
// OLD - pulls from voyageAwards directly
const voyageRows = data.voyageAwards.rows;
data.gullinbursti.rows.forEach(row => { /* name match */ });

// NEW - uses parsed data
const leaderboard = parseAllLeaderboardEntries(data.voyageAwards.rows);
const topHosts = getTopHosts(leaderboard, 5);
const topVoyagers = getTopVoyagers(leaderboard, 5);
```

### Step 4: Enrich Crew with Leaderboard Data
Combine Gullinbursti crew with Voyage Awards metrics:
```typescript
const crew = parseAllCrewMembers(data.gullinbursti.rows);
const leaderboard = parseAllLeaderboardEntries(data.voyageAwards.rows);

const enrichedCrew = crew.map(member =>
  enrichCrewWithLeaderboardData(member, leaderboard)
);

// Now each crew member has: voyageCount, hostCount, daysInactive
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────┐
│         SheetDataContext                     │
│  (Fetches raw from Google Sheets)            │
└────────────┬────────────────────────────────┘
             │ raw rows/headers
             ↓
┌─────────────────────────────────────────────┐
│      dataParser.ts (Single Source Truth)     │
│  ├─ parseAllCrewMembers()                    │
│  ├─ parseAllLeaderboardEntries()             │
│  ├─ parseAllSubclassProgress()               │
│  └─ enrichCrewWithLeaderboardData()          │
└────────────┬────────────────────────────────┘
             │ Typed ParsedCrewMember[]
             ↓
┌─────────────────────────────────────────────┐
│    All Components (UsersTab, Overview, etc.) │
│    Read normalized data only                 │
│    No direct sheet access                    │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Files Changed
- ✅ `src/config/SheetColumns.ts` (new) - 280 lines
- ✅ `src/services/dataParser.ts` (new) - 360 lines
- ✅ `DATA_HEALTH_AUDIT.md` (new) - Comprehensive audit
- ✅ Commit: `6cc14d8`

---

## ✨ Ready for Phase 2

The infrastructure is now in place. Components can be refactored one at a time:
1. UsersTab → implement crew parsing
2. ActionsTab → use parsed crew + implement comment-based actions
3. OverviewTab → use enriched data for leaderboards
4. ReportsTab → use parsed data for PDF generation

Each refactor will remove 50+ lines of duplicate code and eliminate magic indices.

---

## Questions?

All sheet structures are documented in `SheetColumns.ts`. If new fields are needed:
1. Add column index to appropriate `_COLUMNS` object
2. Add parsing logic to corresponding `parseXxx()` function
3. Update `ParsedXxx` interface
4. TypeScript will guide implementation

🚢⚓ Ready to refactor components!
