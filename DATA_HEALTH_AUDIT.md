# Data Health Audit Report

## Current Data Architecture

### Three Linked Sheets via Google Sheets API

#### 1. **Gullinbursti** (Crew Roster)
- **Range**: `Gullinbursti!A8:W49`
- **Spreadsheet ID**: `1EiLym2gcxcxmwoTHkHD9m9MisRqC3lmjJbBUBzqlZI0`
- **Primary Use**: Users Tab, Actions Tab, Overview Tab, Reports Tab

##### Currently Captured Fields (by header index):
| Index | Field | Used In | Notes |
|-------|-------|---------|-------|
| [0] | Rank | All | ✅ Captured in UsersTab, ReportsTab, ActionsTab |
| [1] | Name | All | ✅ Captured in UsersTab, ReportsTab, ActionsTab |
| [2] | Discord Nickname | UsersTab | ✅ Captured in UsersTab |
| [3] | ? (Squad?) | ActionsTab | ⚠️ Fallback check if headers[3] is a squad |
| [4-6] | ? | Unknown | ❓ Not explicitly used |
| [7] | Timezone | UsersTab, ReportsTab | ✅ Captured in both |
| [8] | Compliance/LOA Status | All | ✅ Captured everywhere |
| [9] | ? | Unknown | ❓ Not used |
| [10] | Chat Activity/Stars | UsersTab, ReportsTab, ActionsTab | ✅ Captured everywhere |
| [11-22] | ? | Unknown | ❓ Not used |

##### Missing/Unknown Data:
- Column headers 4-6, 9, 11-22 are never accessed
- No explicit "Squad" column extraction (fallback uses headers[3])
- No "Service Date" / "Join Date" captured (needed for promotions)
- No explicit "Sailing/Voyage" status columns
- No explicit "Hosting" status columns
- No explicit Host Count or Voyage Count (pulled from Voyage Awards instead)
- No "Staff Comments" extraction (task generation requirement)

---

#### 2. **Time/Voyage Awards** (Hosting & Sailing Activity)
- **Range**: `Time/Voyage Awards!A1:AH34`
- **Spreadsheet ID**: `1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI`
- **Primary Use**: ReportsTab (leaderboards), OverviewTab (top hosts/voyagers)

##### Currently Captured Fields:
- ❓ Only accessed via name matching (not by header index)
- Extracts "Host Count" and "Voyage Count" by column name search
- Rows are parsed generically without explicit field mapping

##### Missing/Incomplete:
- No structured header mapping
- No clear documentation of available columns
- No date tracking for voyage participation
- No rank-based voyage classification
- No sailing status indicators

---

#### 3. **Role/Coin Awards**
- **Range**: `Role/Coin Awards!A1:O34`
- **Spreadsheet ID**: `1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI`
- **Current Use**: Fetched but **NOT USED ANYWHERE**

##### Status: ⚠️ **UNUSED DATA**
- Loaded in SheetDataContext but no components extract data
- No parsing logic implemented
- Needed for: Awards eligibility, promotions, role assignment

---

## Data Flow Problems

### ❌ Problem 1: No Data Normalization Layer
- Each component independently parses raw sheet data
- Uses magic index numbers (headers[0], headers[7], headers[8], headers[10])
- Changes to sheet structure break multiple files
- No single source of truth for field locations

### ❌ Problem 2: Overview Tab Relies on Raw Gullinbursti
- Duplicates parsing logic from UsersTab
- Directly accesses sheet data instead of using parsed crew data
- Makes requests to external sheets for info available in Users tab
- Creates stale/duplicate data if UsersTab and OverviewTab diverge

### ❌ Problem 3: Voyage Awards Used as External Lookup
- ReportsTab searches voyageAwards by name matching (inefficient)
- OverviewTab also does separate name matching for leaderboards
- No central place to derive host/voyage counts per sailor

### ❌ Problem 4: Role/Coin Awards Completely Unused
- Data fetched but never parsed
- Needed for Awards Tab eligibility
- Needed for Promotions eligibility

### ❌ Problem 5: Missing Fields Never Extracted
- No staff comments from Gullinbursti
- No service dates (needed for promotions)
- No sailing status vs hosting status split
- No endorsement/requirement tracking

---

## Recommended Data Health Plan

### Phase 1: Create a Data Parsing Service
Create `src/services/dataParser.ts` with:

```typescript
interface ParsedCrew {
  rank: string;
  name: string;
  discord: string;
  squad: string;
  timezone: string;
  compliance: string;
  chatActivity: number;
  serviceDate?: string;
  sailingStatus?: string;
  hostingStatus?: string;
  staffComments?: string;
  hostCount: number;
  voyageCount: number;
}

export const parseCrewData = (gullinbursti, voyageAwards): ParsedCrew[] => {
  // Centralized parsing logic
}
```

### Phase 2: Document Sheet Structure
Create mapping files:

```typescript
// src/config/SheetColumns.ts
export const GULLINBURSTI_COLUMNS = {
  RANK: 0,
  NAME: 1,
  DISCORD: 2,
  SQUAD: 3,
  JOINED: 4,
  TIMEZONE: 7,
  COMPLIANCE: 8,
  CHAT_ACTIVITY: 10,
  SAILING_STATUS: 11, // ← Need to identify
  HOSTING_STATUS: 12, // ← Need to identify
  STAFF_COMMENTS: 13, // ← Need to identify
};
```

### Phase 3: Consolidate Data Access
- All components read from `useSheetData()` → use normalized ParsedCrew[]
- Overview only uses data from Users/Actions tabs
- Remove redundant parsing logic

### Phase 4: Implement Awards & Promotions Data
- Parse Role/Coin Awards into eligible medals per rank
- Cross-reference with crew host/voyage counts
- Extract service dates for promotion eligibility

---

## Next Steps

1. **What columns exist in Gullinbursti columns 4-6, 9, 11-22?**
   - Need to know what data is available
   
2. **What columns exist in Time/Voyage Awards?**
   - Need exact header names for host/voyage counts
   
3. **What columns exist in Role/Coin Awards?**
   - Need structure for eligibility data

4. **Where are staff comments stored?**
   - Gullinbursti or separate sheet?

5. **Do we have service/join dates?**
   - Needed for promotions tracker

---

## Impact Summary

| Task | Affected Components | Priority |
|------|-------------------|----------|
| Parse all Gullinbursti columns | Users, Actions, Overview, Reports | 🔴 High |
| Parse Voyage Awards structure | Reports, Overview | 🔴 High |
| Parse Role/Coin Awards | Awards Tab (new) | 🟡 Medium |
| Create data normalization layer | All | 🔴 High |
| Extract staff comments | Actions Tab | 🟡 Medium |
| Extract service dates | Promotions Tab (new) | 🟡 Medium |

