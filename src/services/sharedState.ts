/**
 * Shared State Service — replaces localStorage for global persistence.
 *
 * All state is stored on the server (file-backed JSON) so every user
 * who accesses the site sees the same awarded medals, completed actions,
 * promotions, etc.
 *
 * Provides an in-memory cache for instant reads and async server sync.
 */

const getBackendUrl = (): string => {
  return (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:5000';
};

// ==================== IN-MEMORY CACHE ====================

let cache: Record<string, any> = {};
let cacheLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load all state from the server into the cache.
 * Called once on app startup; subsequent calls return the cached data.
 */
export const loadAllState = async (): Promise<void> => {
  if (cacheLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/state`);
      if (res.ok) {
        cache = await res.json();
      }
    } catch (err) {
      console.warn('⚠️ Could not load shared state from server, falling back to localStorage:', err);
      // Fallback: load from localStorage for offline / local dev
      cache = {};
    }
    cacheLoaded = true;
  })();

  return loadPromise;
};

// ==================== GETTERS ====================

/**
 * Get a state value from the cache (synchronous — requires loadAllState first).
 */
export const getState = <T = any>(key: string, fallback: T): T => {
  if (key in cache) return cache[key] as T;

  // Fallback: try localStorage (for migration / offline)
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch { /* ignore */ }

  return fallback;
};

/**
 * Get a state value as a Set<string> (convenience for awarded-medals, promoted-sailors).
 */
export const getStateSet = (key: string): Set<string> => {
  const arr = getState<string[]>(key, []);
  return new Set(arr);
};

// ==================== SETTERS ====================

/**
 * Set a state value — updates cache immediately and syncs to server.
 */
export const setState = async (key: string, value: any): Promise<void> => {
  cache[key] = value;

  // Also mirror to localStorage for offline fallback
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }

  // Sync to server (fire and forget with error logging)
  try {
    await fetch(`${getBackendUrl()}/api/state/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  } catch (err) {
    console.warn(`⚠️ Could not sync state "${key}" to server:`, err);
  }
};

// ==================== CONVENIENCE: SET OPERATIONS ====================

/**
 * Toggle a value in a Set-style state bucket.
 * Returns the new Set.
 */
export const toggleInSet = async (key: string, item: string): Promise<Set<string>> => {
  const set = getStateSet(key);
  if (set.has(item)) set.delete(item); else set.add(item);
  await setState(key, [...set]);
  return set;
};

/**
 * Add a value to a Set-style state bucket (no toggle, just add).
 */
export const addToSet = async (key: string, item: string): Promise<void> => {
  const set = getStateSet(key);
  if (!set.has(item)) {
    set.add(item);
    await setState(key, [...set]);
  }
};

// ==================== CONVENIENCE: RECORD OPERATIONS ====================

/**
 * Get a Record<string, T> from state.
 */
export const getStateRecord = <T = any>(key: string): Record<string, T> => {
  return getState<Record<string, T>>(key, {} as Record<string, T>);
};

/**
 * Update a single key within a Record-style state bucket.
 */
export const updateRecord = async <T = any>(
  stateKey: string,
  recordKey: string,
  value: T,
): Promise<void> => {
  const record = getStateRecord<T>(stateKey);
  record[recordKey] = value;
  await setState(stateKey, record);
};

/**
 * Toggle a boolean within a Record-style state bucket.
 */
export const toggleInRecord = async (stateKey: string, recordKey: string): Promise<boolean> => {
  const record = getStateRecord<boolean>(stateKey);
  record[recordKey] = !record[recordKey];
  await setState(stateKey, record);
  return record[recordKey];
};
