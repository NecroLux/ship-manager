# ⚙️ ConfigTab - Sheet Range Configuration

**Commit**: `6a91d94`  
**Date**: February 11, 2026  
**Feature**: Dynamic sheet range configuration in UI

---

## Problem Solved

When crew data isn't loading, users had no way to adjust the sheet range. The range `Gullinbursti!A8:W49` might be:
- ❌ Out of date
- ❌ Missing new crew rows
- ❌ Not capturing all columns

**Solution**: New ConfigTab allows you to update ranges without code changes!

---

## How to Use ConfigTab

### Step 1: Open Config Tab
1. Go to: https://NecroLux.github.io/ship-manager/
2. Click: **CONFIG** tab (5th tab, right side)

### Step 2: Identify Correct Range
1. Open Google Sheet: Gullinbursti
2. Look for where crew data starts (usually row 8)
3. Look for where it ends (might be row 50, 100, etc.)
4. Note the last column with data (usually W or beyond)

### Step 3: Update Gullinbursti Range
1. In CONFIG tab, find **Gullinbursti (Crew)** section
2. Update the range, e.g.:
   - `Gullinbursti!A8:W100` (starts row 8, all crew to row 100)
   - `Gullinbursti!A:Z` (all data in columns A-Z)
   - `Gullinbursti!A1:Z1000` (large range to capture everything)

### Step 4: Save & Reload
1. Click **"Save & Reload"** button
2. Wait for data to load
3. Go to **CREW** tab to verify crew entries appear

---

## Common Ranges to Try

| Range | Purpose |
|-------|---------|
| `Gullinbursti!A8:W49` | Original range (if data ends at row 49) |
| `Gullinbursti!A8:W100` | Extended to row 100 |
| `Gullinbursti!A1:Z99` | Larger area, includes headers |
| `Gullinbursti!A:Z` | All columns A-Z, all rows with data |
| `Gullinbursti!A8:W` | Starts row 8, all columns through W |

---

## Features in ConfigTab

✅ **Update all three sheet ranges**:
- 📊 Voyage Awards
- 👥 Gullinbursti (Crew)
- 🎖️ Role/Coin Awards

✅ **Current range display** - Shows what's currently configured

✅ **Helpful hints** - Suggests common range formats

✅ **Troubleshooting guide** - Step-by-step instructions

✅ **Real-time feedback** - Save & reload to see changes immediately

---

## Error Messages & Fixes

### "No crew data available"

**Causes**:
1. Wrong sheet range
2. Crew data moved to different rows
3. Google Sheets permissions issue

**Fixes**:
1. Try a larger range: `Gullinbursti!A1:Z200`
2. Try: `Gullinbursti!A:Z` (all data)
3. Check Google Sheets has proper sharing settings

### Still no data after updating range?

1. Check Render backend is running
2. Go to browser Console (F12) for error messages
3. Verify Google Sheets spreadsheet ID
4. Check service account has read access to sheet

---

## What Gets Saved

When you click "Save & Reload":
1. ✅ Ranges saved to localStorage
2. ✅ New fetch request to backend with new range
3. ✅ Data reloaded from Google Sheets
4. ✅ Changes persist across browser sessions

---

## Ranges Explained

**Google Sheets Range Format:**
```
SheetName!StartCell:EndCell

Examples:
- Gullinbursti!A8:W49     → Starts A8, ends W49
- Gullinbursti!A1:Z       → From A1 to Z (all rows)
- Gullinbursti!A:Z        → Entire columns A through Z
```

---

## How to Find Your Crew Range

1. **Open your Gullinbursti sheet**
2. **Look for headers** (Rank, Name, Squad, etc.)
   - Usually in row 7 or 8
   - Note the starting row (e.g., row 8)

3. **Look for last crew member** (scroll down)
   - Note the row number

4. **Look for last column with data**
   - Scroll right to find
   - Note the column letter (e.g., W, AA, AB)

5. **Construct range**: `Gullinbursti!A8:W100`
   - A8 = Start at column A, row 8
   - W100 = End at column W, row 100

---

## Testing the Config

### Method 1: Direct Feedback
1. Update range
2. Click "Save & Reload"
3. Go to CREW tab
4. ✅ Should show crew entries

### Method 2: Console Check
1. Open DevTools (F12)
2. Check Console tab for errors
3. Look for success messages

---

## Quick Troubleshooting Checklist

- [ ] Backend is running (check Render status)
- [ ] Google Sheets ID is correct
- [ ] Sheet name is spelled correctly (case-sensitive)
- [ ] Range format is correct (e.g., `A8:W49`)
- [ ] Google Sheets has crew data in that range
- [ ] Service account has read access
- [ ] Tried "Save & Reload" button

---

## Architecture

```
User updates range in ConfigTab
         ↓
Calls updateSheetRange()
         ↓
Saves to localStorage
         ↓
Calls refreshData()
         ↓
Makes new fetch with new range
         ↓
Backend requests Google Sheets
         ↓
Returns data
         ↓
Displays in CREW tab ✅
```

---

## Files Modified

- ✅ `src/components/ConfigTab.tsx` - New configuration UI
- ✅ `src/App.tsx` - Replaced LinkedSheetsTab with ConfigTab

---

## Summary

✅ **New ConfigTab in UI** - Click to access  
✅ **Update sheet ranges** - No code changes needed  
✅ **Save & Reload** - Real-time testing  
✅ **Troubleshooting guide** - Built-in help  
✅ **Persistent storage** - Changes saved

**To fix crew data: Go to CONFIG tab and update the Gullinbursti range!** 🚀
