/**
 * Manual Snapshot Creator for February 1st, 2026
 * This script helps you create a snapshot of current crew data backdated to 02/01/2026
 * 
 * Usage in browser console:
 * 1. Open DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste the code below
 * 4. It will create a snapshot for February 1st with current crew data
 */

// Function to create a February 1st snapshot from current data
function createFeb1Snapshot() {
  try {
    // Get current crew data from the Crew context/state
    // This assumes you've already loaded the data in the app
    
    // Create the snapshot structure
    const snapshot = {
      date: '2026-02-01',  // February 1st, 2026
      month: '2026-02',    // February 2026
      crew: [
        // You'll need to populate this with actual crew data
        // Each entry should have: rank, name, squad, compliance, timezone, stars
      ],
      totalCrew: 0,
      complianceCount: 0,
      squadBreakdown: {},
    };

    // Get existing snapshots from localStorage
    const existingSnapshots = localStorage.getItem('crew-snapshots');
    let snapshots = existingSnapshots ? JSON.parse(existingSnapshots) : [];

    // Check if February snapshot already exists
    const februaryExists = snapshots.some(s => s.month === '2026-02');
    if (februaryExists) {
      console.log('⚠️  February 2026 snapshot already exists!');
      console.log('Existing:', snapshots.find(s => s.month === '2026-02'));
      return;
    }

    // Add new snapshot and sort by date
    snapshots = [snapshot, ...snapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Save to localStorage
    localStorage.setItem('crew-snapshots', JSON.stringify(snapshots));

    console.log('✅ February 1st snapshot created!');
    console.log('Date:', snapshot.date);
    console.log('Total crew:', snapshot.totalCrew);
    console.log('Compliance count:', snapshot.complianceCount);
    
    // Reload the page to see the snapshot
    console.log('Reloading page to apply snapshot...');
    setTimeout(() => window.location.reload(), 1000);

  } catch (error) {
    console.error('❌ Failed to create snapshot:', error);
  }
}

// Alternative: Extract crew data from current UI and create snapshot
async function createFeb1SnapshotWithCurrentData() {
  try {
    // This function needs to be called from within the app context
    // to have access to the crew data
    
    console.log('📸 Creating February 1st snapshot with current crew data...');
    
    // If you're in the Reports tab or have access to crew data via context:
    const crewData = [
      // This would be populated from your data source
      // Format: { rank, name, squad, compliance, timezone, stars }
    ];

    if (crewData.length === 0) {
      console.warn('⚠️  No crew data found. Make sure data is loaded in the app first.');
      console.log('Steps to fix:');
      console.log('1. Load the Crew/Users tab to ensure data is fetched');
      console.log('2. Then run this script again');
      return;
    }

    // Create snapshot
    const squadBreakdown = {};
    let complianceCount = 0;

    crewData.forEach((member) => {
      squadBreakdown[member.squad] = (squadBreakdown[member.squad] || 0) + 1;
      const complianceLower = member.compliance.toLowerCase();
      if (
        complianceLower.includes('active') ||
        complianceLower.includes('duty') ||
        complianceLower === 'within regulations' ||
        complianceLower === 'compliant'
      ) {
        complianceCount++;
      }
    });

    const snapshot = {
      date: '2026-02-01',
      month: '2026-02',
      crew: crewData,
      totalCrew: crewData.length,
      complianceCount,
      squadBreakdown,
    };

    // Save to localStorage
    let snapshots = [];
    const existing = localStorage.getItem('crew-snapshots');
    if (existing) {
      snapshots = JSON.parse(existing);
      // Remove if already exists
      snapshots = snapshots.filter(s => s.month !== '2026-02');
    }

    snapshots = [snapshot, ...snapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    localStorage.setItem('crew-snapshots', JSON.stringify(snapshots));

    console.log('✅ February 1st snapshot created successfully!');
    console.log('📊 Snapshot details:');
    console.log('  Date:', snapshot.date);
    console.log('  Total crew:', snapshot.totalCrew);
    console.log('  Compliant:', snapshot.complianceCount);
    console.log('  Squad breakdown:', snapshot.squadBreakdown);
    console.log('\n🔄 Reloading page...');
    
    setTimeout(() => window.location.reload(), 1500);

  } catch (error) {
    console.error('❌ Error creating snapshot:', error);
  }
}

// Run this in the app with crew data access
console.log('🚀 February 1st Snapshot Creator loaded!');
console.log('Use: createFeb1SnapshotWithCurrentData()');
