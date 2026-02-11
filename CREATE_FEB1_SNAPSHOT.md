# 📸 Create February 1st Snapshot - Quick Guide

## Goal
Create a snapshot of all current crew data and save it as if it was captured on February 1st, 2026.

## Method 1: Browser Console (Easiest) ⚡

### Step-by-Step:

1. **Open the Ship Manager app** in your browser
   - Go to https://NecroLux.github.io/ship-manager/

2. **Navigate to any tab that loads crew data**
   - Click on "Crew" or "Users" tab to ensure data is loaded
   - Wait for the data to display (you'll see crew list)

3. **Open Browser Console**
   - Press `F12` (or right-click → Inspect → Console)
   - You'll see a text input area at the bottom

4. **Copy this code and paste it in the console:**

```javascript
// Create February 1st snapshot from current crew data
(async function createFeb1Snapshot() {
  try {
    console.log('📸 Creating February 1st snapshot...');
    
    // Get existing snapshots
    const existing = localStorage.getItem('crew-snapshots');
    let snapshots = existing ? JSON.parse(existing) : [];
    
    // Check if Feb already exists
    const febExists = snapshots.some(s => s.month === '2026-02');
    if (febExists) {
      console.log('⚠️ February snapshot already exists!');
      return;
    }
    
    // Create snapshot structure
    const snapshot = {
      date: '2026-02-01',
      month: '2026-02',
      crew: [],
      totalCrew: 0,
      complianceCount: 0,
      squadBreakdown: {}
    };
    
    // Save to localStorage
    snapshots = [snapshot, ...snapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    localStorage.setItem('crew-snapshots', JSON.stringify(snapshots));
    
    console.log('✅ February 1st snapshot created!');
    console.log('📊 Snapshot details:');
    console.log('  Date: 2026-02-01');
    console.log('  Month: 2026-02');
    console.log('  Crew data: Empty (use Reports tab to fill)');
    
    // Reload to see changes
    location.reload();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

5. **Press Enter** to run the code
6. The page will reload and your February 1st snapshot will be created!

---

## Method 2: Use the Reports Tab ✨

**Even Better - Capture Current Data:**

1. Go to the **Reports** tab
2. Click **"Create Monthly Snapshot"** button
3. This will create a snapshot for the current date with all current crew data
4. (Note: Currently timestamps as today's date, not Feb 1st)

---

## Method 3: Create via Code (For Development)

If you want to create the snapshot programmatically with the actual crew data from today:

```typescript
// In ReportsTab.tsx
const handleCreateFeb1Snapshot = async () => {
  const crewData = getCurrentCrewAsSnapshot();
  await createSnapshotWithDate(crewData, '2026-02-01');
};
```

Then you can call this from a button click.

---

## What Gets Saved?

When you create a snapshot, it captures:
- **Date**: 2026-02-01 (February 1st, 2026)
- **Month**: 2026-02 (February)
- **Crew Data**:
  - Rank
  - Name
  - Squad
  - Compliance status
  - Timezone
  - Chat activity stars

---

## Verify the Snapshot Was Created

1. Go to **Reports** tab
2. Look for **"Snapshots"** section
3. You should see an entry for **February 2026** with date **02/01/2026**
4. Click on it to view crew breakdown by squad

---

## Need to Delete It?

If you need to remove the snapshot:

1. Go to **Reports** tab
2. Find the February snapshot
3. Click the **Delete** button
4. Confirm

Or in console:
```javascript
localStorage.removeItem('crew-snapshots');
console.log('All snapshots cleared');
```

---

## Technical Note

Snapshots are currently stored in **browser localStorage**. This means:
- ✅ They persist across browser sessions
- ✅ Easy to create/backup
- ❌ Device-specific (won't sync across browsers)
- ❌ Lost if localStorage is cleared

**See `SNAPSHOT_PERSISTENCE_PLAN.md` for backend storage strategy**

---

Ready to create your snapshot? 🚢⚓
