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
  updateSheetRange: (sheetKey: 'voyage-awards' | 'gullinbursti', newRange: string) => Promise<void>;
  ranges: { voyageAwards: string; gullinbursti: string };
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

// Sheet 1: Voyage Awards
const VOYAGE_AWARDS_SPREADSHEET_ID = '1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI';
const VOYAGE_AWARDS_RANGE = 'Time/Voyage Awards!A1:AH34';

// Sheet 2: Gullinbursti
const GULLINBURSTI_SPREADSHEET_ID = '1EiLym2gcxcxmwoTHkHD9m9MisRqC3lmjJbBUBzqlZI0';
const GULLINBURSTI_RANGE = 'Gullinbursti!A8:W49';

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
      const errorText = await response.text();
      console.error(`HTTP ${response.status} error:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Sheet data received:', result);

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
  const [ranges, setRanges] = useState({
    voyageAwards: VOYAGE_AWARDS_RANGE,
    gullinbursti: GULLINBURSTI_RANGE,
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both sheets in parallel with current ranges
      const [voyageAwardsData, gullinburstiData] = await Promise.all([
        fetchSheetData(VOYAGE_AWARDS_SPREADSHEET_ID, ranges.voyageAwards, true),
        fetchSheetData(GULLINBURSTI_SPREADSHEET_ID, ranges.gullinbursti, false),
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

  const updateSheetRange = async (sheetKey: 'voyage-awards' | 'gullinbursti', newRange: string) => {
    try {
      // Update the range in state
      if (sheetKey === 'voyage-awards') {
        setRanges(prev => ({ ...prev, voyageAwards: newRange }));
        // Save to localStorage
        localStorage.setItem('sheetRange_voyageAwards', newRange);
      } else {
        setRanges(prev => ({ ...prev, gullinbursti: newRange }));
        // Save to localStorage
        localStorage.setItem('sheetRange_gullinbursti', newRange);
      }

      // Refetch data immediately with new range
      setLoading(true);
      setError(null);

      const spreadsheetId = sheetKey === 'voyage-awards' 
        ? VOYAGE_AWARDS_SPREADSHEET_ID 
        : GULLINBURSTI_SPREADSHEET_ID;

      const filterEmptyFirst = sheetKey === 'voyage-awards';
      const newData = await fetchSheetData(spreadsheetId, newRange, filterEmptyFirst);

      setData(prev => ({
        ...prev,
        [sheetKey === 'voyage-awards' ? 'voyageAwards' : 'gullinbursti']: newData,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update sheet range';
      setError(`Error updating range: ${errorMessage}`);
      console.error('Error updating sheet range:', err);
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
        updateSheetRange,
        ranges,
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
