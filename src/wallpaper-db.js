// Wallpaper local persistent storage using IndexedDB
// Avoids localStorage quota limits for image data

const DB_NAME = 'FinancialMemoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'settings_media';
const KEY = 'custom_wallpaper';

export const MAX_WALLPAPER_SIZE = 6 * 1024 * 1024; // 6MB limit
export const ALLOWED_WALLPAPER_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

// Fallback in-memory store for Node.js / non-browser test environments
let memoryWallpaperBlob = null;

function isIndexedDBAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return resolve(null);
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function validateWallpaperFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const hasValidExt = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
  const hasValidType = ALLOWED_WALLPAPER_TYPES.includes(type);

  if (!hasValidType && !hasValidExt) {
    return {
      valid: false,
      error: 'Unsupported image format. Please select a PNG, JPEG, or WebP image.'
    };
  }
  if (file.size > MAX_WALLPAPER_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb}MB). Maximum allowed size is 6MB.`
    };
  }
  return { valid: true };
}

export async function getWallpaper() {
  if (!isIndexedDBAvailable()) {
    return memoryWallpaperBlob;
  }
  try {
    const db = await openDB();
    if (!db) return memoryWallpaperBlob;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve wallpaper from IndexedDB:', err);
    return memoryWallpaperBlob;
  }
}

export async function saveWallpaper(blob) {
  if (!isIndexedDBAvailable()) {
    memoryWallpaperBlob = blob;
    return true;
  }
  try {
    const db = await openDB();
    if (!db) {
      memoryWallpaperBlob = blob;
      return true;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save wallpaper to IndexedDB:', err);
    memoryWallpaperBlob = blob;
    return true;
  }
}

export async function deleteWallpaper() {
  memoryWallpaperBlob = null;
  if (!isIndexedDBAvailable()) {
    return true;
  }
  try {
    const db = await openDB();
    if (!db) return true;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete wallpaper from IndexedDB:', err);
    return true;
  }
}
