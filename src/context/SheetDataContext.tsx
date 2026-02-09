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

interface AppData {
  voyageAwards: SheetData;
  gullinbursti: SheetData;
}

interface SheetContextType {
  data: AppData;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

// Sheet 1: Voyage Awards
const VOYAGE_AWARDS_SPREADSHEET_ID = '1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI';
const VOYAGE_AWARDS_RANGE = 'Time/Voyage Awards!A1:O900';

// Sheet 2: Gullinbursti
const GULLINBURSTI_SPREADSHEET_ID = '1EiLym2gcxcxmwoTHkHD9m9MisRqC3lmjJbBUBzqlZI0';
const GULLINBURSTI_RANGE = 'Gullinbursti!A1:W64';

const emptySheetData: SheetData = {
  headers: [],
  rows: [],
  rowCount: 0,
  lastUpdated: null,
};

const fetchSheetData = async (
  spreadsheetId: string,
  range: string,
  filterEmptyFirst: boolean = true
): Promise<SheetData> => {
  try {
    // Determine backend URL based on environment
    // In production (GitHub Pages), use Render backend
    // In development, use localhost
    const isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const backendUrl = isDevelopment 
      ? 'http://localhost:5000'
      : 'https://ship-manager.onrender.com';
    
    console.log('Backend URL:', backendUrl, '(isDevelopment:', isDevelopment, ')'); // Debug log
    const response = await fetch(`${backendUrl}/api/sheets/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId,
        range,
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

    // Filter out rows that have "-" in the first column (column A) if enabled
    const filteredRows = filterEmptyFirst
      ? rowsAsObjects.filter((row: SheetRow) => {
          const firstColumnValue = row[result.headers[0]];
          return firstColumnValue && firstColumnValue.trim() !== '-';
        })
      : rowsAsObjects;

    return {
      headers: result.headers,
      rows: filteredRows,
      rowCount: filteredRows.length,
      lastUpdated: new Date(),
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Error fetching sheet (${spreadsheetId}, ${range}):`, errorMsg);
    // Log the full error for debugging
    if (err instanceof Error) {
      console.error('Stack trace:', err.stack);
    }
    throw err;
  }
};

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>({
    voyageAwards: emptySheetData,
    gullinbursti: emptySheetData,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both sheets in parallel
      const [voyageAwardsData, gullinburstiData] = await Promise.all([
        fetchSheetData(VOYAGE_AWARDS_SPREADSHEET_ID, VOYAGE_AWARDS_RANGE, true),
        fetchSheetData(GULLINBURSTI_SPREADSHEET_ID, GULLINBURSTI_RANGE, false),
      ]);

      setData({
        voyageAwards: voyageAwardsData,
        gullinbursti: gullinburstiData,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sheet data';
      setError(`Backend Error: ${errorMessage}. Check browser console for details.`);
      console.error('Full error fetching all sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();

    // Optional: Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SheetContext.Provider
      value={{
        data,
        loading,
        error,
        refreshData: fetchAllData,
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
