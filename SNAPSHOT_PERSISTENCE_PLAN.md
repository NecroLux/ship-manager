# Snapshot Persistence Migration Plan

## Problem
Snapshots are currently stored in browser localStorage, which is device/browser-specific. They don't sync across browsers or devices.

## Solution: Backend-Powered Persistence

### Architecture Overview

```
┌─────────────────────────────────────┐
│  Browser 1 (Chrome)                  │
│  ┌─────────────────────────────────┐│
│  │ SnapshotContext                  ││
│  │ └─ Creates snapshot              ││
│  └─────────┬───────────────────────┘│
└────────────┼──────────────────────────┘
             │ POST /api/snapshots
             ↓
┌─────────────────────────────────────┐
│  Render Backend                      │
│  ┌─────────────────────────────────┐│
│  │ /api/snapshots (CRUD)            ││
│  │ ├─ POST   → Create snapshot      ││
│  │ ├─ GET    → List all snapshots   ││
│  │ ├─ DELETE → Delete snapshot      ││
│  └─────────┬───────────────────────┘│
│  ┌─────────┴───────────────────────┐│
│  │ MongoDB / PostgreSQL / JSON file ││
│  │ Persistent storage               ││
│  └─────────────────────────────────┘│
└─────────────┬──────────────────────────┘
             │ GET /api/snapshots
┌────────────┼──────────────────────────┐
│  Browser 2 (Firefox)                 │
│  ┌─────────┴───────────────────────┐│
│  │ SnapshotContext                  ││
│  │ └─ Loads snapshots from backend  ││
│  └─────────────────────────────────┘│
└────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add Backend API Endpoints (server.ts)

```typescript
// POST /api/snapshots - Create a snapshot
app.post('/api/snapshots', async (req, res) => {
  try {
    const snapshot = req.body;
    // Save to persistent storage
    // Return created snapshot with ID
  }
});

// GET /api/snapshots - Get all snapshots
app.get('/api/snapshots', async (req, res) => {
  try {
    // Retrieve all snapshots from storage
    // Return array of snapshots
  }
});

// DELETE /api/snapshots/:month - Delete a snapshot
app.delete('/api/snapshots/:month', async (req, res) => {
  try {
    // Delete snapshot for given month
    // Return success
  }
});

// POST /api/reports - Create a report
app.post('/api/reports', async (req, res) => {
  try {
    const report = req.body;
    // Save report to persistent storage
  }
});

// GET /api/reports - Get all reports
app.get('/api/reports', async (req, res) => {
  try {
    // Retrieve all reports
  }
});
```

### Step 2: Update SnapshotContext

Replace localStorage with API calls:

```typescript
// OLD - localStorage
const createSnapshot = async (crew: CrewSnapshot[]): Promise<MonthlySnapshot> => {
  const snapshot = { /* ... */ };
  localStorage.setItem('crew-snapshots', JSON.stringify([...snapshots, snapshot]));
};

// NEW - backend API
const createSnapshot = async (crew: CrewSnapshot[]): Promise<MonthlySnapshot> => {
  const snapshot = { /* ... */ };
  const response = await fetch(`${backendUrl}/api/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  const created = await response.json();
  setSnapshots([...snapshots, created]);
  return created;
};
```

### Step 3: Backend Storage Options

Choose ONE of these for persistent storage:

#### Option A: JSON File (Simplest, Free)
```typescript
// Store in data/snapshots.json on Render
const snapshotFile = './data/snapshots.json';
const snapshots = JSON.parse(fs.readFileSync(snapshotFile));
```

**Pros**: No dependencies, works on Render free tier
**Cons**: File-based, not ideal for concurrent access

#### Option B: PostgreSQL (Better, Still Free)
Render offers free PostgreSQL databases.
```typescript
// Create table: crew_snapshots
// Columns: id, month, date, crew_data, created_at
const snapshot = await db.query(
  'INSERT INTO crew_snapshots (month, crew_data) VALUES ($1, $2)',
  [monthStr, JSON.stringify(crew)]
);
```

#### Option C: SQLite (Lightweight)
Built-in Node.js support, perfect for small deployments.
```typescript
const db = new Database('./data/snapshots.db');
db.prepare('INSERT INTO snapshots (month, data) VALUES (?, ?)')
  .run(monthStr, JSON.stringify(crew));
```

---

## Quick Implementation (Session 2)

**Option**: Use JSON file storage (simplest)

**Files to create/modify**:
1. `server/routes/snapshots.ts` - API endpoints
2. `server/storage/snapshotStore.ts` - File operations
3. `src/context/SnapshotContext.tsx` - Replace localStorage with API
4. `src/services/snapshotService.ts` - Fetch wrapper

**Time estimate**: 2-3 hours

---

## Benefit

✅ **Device/browser independent** - All devices see same snapshots
✅ **Persistent** - Data survives browser cache clears
✅ **Shareable** - Multiple users can see crew reports
✅ **Backup-friendly** - Backend data can be backed up

---

## For Now (Quick Fix)

If you want a temporary fix:

1. **Export snapshots** from your current browser (manually)
2. **Store locally** as a JSON backup
3. **Import** into new browsers

Then implement the backend persistence in Phase 2.

---

## Questions?

- Want to use PostgreSQL (best) or JSON file (simplest)?
- Should snapshots be user-specific or shared across all dashboard users?
- Do you need audit logging (who created/deleted snapshots)?

Let me know and I'll build the backend endpoints!
