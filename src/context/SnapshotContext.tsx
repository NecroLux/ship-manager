import { createContext, useContext, useState, ReactNode } from 'react';

export interface CrewSnapshot {
  rank: string;
  name: string;
  squad: string;
  compliance: string;
  timezone: string;
  stars: string;
}

export interface MonthlySnapshot {
  date: string; // ISO date string
  month: string; // "YYYY-MM" format
  crew: CrewSnapshot[];
  totalCrew: number;
  complianceCount: number;
  squadBreakdown: Record<string, number>;
}

interface SnapshotContextType {
  snapshots: MonthlySnapshot[];
  loading: boolean;
  error: string | null;
  createSnapshot: (crew: CrewSnapshot[]) => Promise<MonthlySnapshot>;
  loadSnapshots: () => Promise<void>;
  getSnapshotForMonth: (month: string) => MonthlySnapshot | null;
  deleteSnapshot: (date: string) => Promise<void>;
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

export const SnapshotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new snapshot
  const createSnapshot = async (crew: CrewSnapshot[]): Promise<MonthlySnapshot> => {
    try {
      setError(null);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const monthStr = dateStr.substring(0, 7); // YYYY-MM

      // Calculate stats
      const squadBreakdown: Record<string, number> = {};
      let complianceCount = 0;

      crew.forEach((member) => {
        squadBreakdown[member.squad] = (squadBreakdown[member.squad] || 0) + 1;
        
        const complianceLower = member.compliance.toLowerCase();
        if (
          complianceLower.includes('active') ||
          complianceLower.includes('duty') ||
          complianceLower === 'within regulations'
        ) {
          complianceCount++;
        }
      });

      const snapshot: MonthlySnapshot = {
        date: dateStr,
        month: monthStr,
        crew,
        totalCrew: crew.length,
        complianceCount,
        squadBreakdown,
      };

      // In a real implementation, this would save to Google Sheets
      // For now, just store in memory and localStorage
      const updatedSnapshots = [snapshot, ...snapshots].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setSnapshots(updatedSnapshots);

      // Save to localStorage for persistence
      try {
        localStorage.setItem('crew-snapshots', JSON.stringify(updatedSnapshots));
      } catch (e) {
        console.warn('Failed to save snapshots to localStorage:', e);
      }

      return snapshot;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create snapshot';
      setError(errorMsg);
      throw err;
    }
  };

  // Load snapshots from storage
  const loadSnapshots = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from localStorage for now
      const stored = localStorage.getItem('crew-snapshots');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSnapshots(parsed);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load snapshots';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get snapshot for a specific month
  const getSnapshotForMonth = (month: string): MonthlySnapshot | null => {
    return snapshots.find((s) => s.month === month) || null;
  };

  // Delete a snapshot
  const deleteSnapshot = async (date: string) => {
    try {
      const updated = snapshots.filter((s) => s.date !== date);
      setSnapshots(updated);

      try {
        localStorage.setItem('crew-snapshots', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update localStorage:', e);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete snapshot';
      setError(errorMsg);
      throw err;
    }
  };

  return (
    <SnapshotContext.Provider
      value={{
        snapshots,
        loading,
        error,
        createSnapshot,
        loadSnapshots,
        getSnapshotForMonth,
        deleteSnapshot,
      }}
    >
      {children}
    </SnapshotContext.Provider>
  );
};

export const useSnapshots = () => {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error('useSnapshots must be used within SnapshotProvider');
  }
  return context;
};
