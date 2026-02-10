import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

export interface MonthlyReport {
  month: string; // "YYYY-MM" format
  generatedDate: string; // ISO date string
  pdfData?: string; // Base64 encoded PDF or blob reference
}

interface SnapshotContextType {
  snapshots: MonthlySnapshot[];
  reports: MonthlyReport[];
  loading: boolean;
  error: string | null;
  createSnapshot: (crew: CrewSnapshot[]) => Promise<MonthlySnapshot>;
  loadSnapshots: () => Promise<void>;
  getSnapshotForMonth: (month: string) => MonthlySnapshot | null;
  deleteSnapshot: (date: string) => Promise<void>;
  generateReport: (month: string) => Promise<MonthlyReport>;
  loadReports: () => Promise<void>;
  getReportsHistory: () => MonthlyReport[];
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

export const SnapshotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check and trigger auto-snapshot on the 1st of month
  useEffect(() => {
    const checkAutoSnapshot = () => {
      const now = new Date();
      const dayOfMonth = now.getDate();
      const currentMonth = now.toISOString().substring(0, 7);
      
      // Check if today is the 1st and we don't already have a snapshot for this month
      if (dayOfMonth === 1) {
        const hasSnapshot = snapshots.some(s => s.month === currentMonth);
        if (!hasSnapshot) {
          // Auto-snapshot condition detected (1st of month) - will be created when crew data available
        }
      }
    };

    // Check once on mount and every hour
    checkAutoSnapshot();
    const interval = setInterval(checkAutoSnapshot, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, [snapshots]);

  // Check and log auto-report generation on the last day of month
  useEffect(() => {
    const checkAutoReport = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // If tomorrow is the 1st, then today is the last day of month
      if (tomorrow.getDate() === 1) {
        const currentMonth = now.toISOString().substring(0, 7);
        const hasReport = reports.some(r => r.month === currentMonth);
        if (!hasReport) {
          // Auto-report condition detected (last day of month) - report generation deferred to ReportsTab
        }
      }
    };

    checkAutoReport();
    const interval = setInterval(checkAutoReport, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, [reports]);

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

  // Load reports from storage
  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const stored = localStorage.getItem('crew-reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        setReports(parsed);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load reports';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Generate a report for a specific month
  const generateReport = async (month: string): Promise<MonthlyReport> => {
    try {
      setError(null);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      const report: MonthlyReport = {
        month,
        generatedDate: dateStr,
      };

      // Store report metadata
      const updatedReports = [report, ...reports].sort(
        (a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()
      );
      setReports(updatedReports);

      try {
        localStorage.setItem('crew-reports', JSON.stringify(updatedReports));
      } catch (e) {
        console.warn('Failed to save reports to localStorage:', e);
      }

  // Report generated and saved to history
      return report;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMsg);
      throw err;
    }
  };

  // Get reports history
  const getReportsHistory = (): MonthlyReport[] => {
    return reports.sort(
      (a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()
    );
  };

  return (
    <SnapshotContext.Provider
      value={{
        snapshots,
        reports,
        loading,
        error,
        createSnapshot,
        loadSnapshots,
        getSnapshotForMonth,
        deleteSnapshot,
        generateReport,
        loadReports,
        getReportsHistory,
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
