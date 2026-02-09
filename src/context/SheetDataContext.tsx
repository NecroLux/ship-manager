import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SheetRow {
  [key: string]: string;
}

interface SheetData {
  headers: string[];
  rows: SheetRow[];
  rowCount: number;
  lastUpdated: Date | null;
}

interface SheetContextType {
  data: SheetData;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

const SPREADSHEET_ID = '1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI';
const SHEET_RANGE = 'Time/Voyage Awards!A1:O900';

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<SheetData>({
    headers: [],
    rows: [],
    rowCount: 0,
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/sheets/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: SPREADSHEET_ID,
          range: SHEET_RANGE,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // Convert array rows to object rows for easier access
      const rowsAsObjects: SheetRow[] = result.rows.map((row: string[]) => {
        const obj: SheetRow = {};
        result.headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      // Filter out rows that have "-" in the first column (column A)
      const filteredRows = rowsAsObjects.filter((row: SheetRow) => {
        const firstColumnValue = row[result.headers[0]];
        return firstColumnValue && firstColumnValue.trim() !== '-';
      });

      setData({
        headers: result.headers,
        rows: filteredRows,
        rowCount: filteredRows.length,
        lastUpdated: new Date(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sheet data';
      setError(errorMessage);
      console.error('Error fetching sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    
    // Optional: Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SheetContext.Provider
      value={{
        data,
        loading,
        error,
        refreshData: fetchData,
      }}
    >
      {children}
    </SheetContext.Provider>
  );
};

export const useSheetData = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('useSheetData must be used within SheetProvider');
  }
  return context;
};
