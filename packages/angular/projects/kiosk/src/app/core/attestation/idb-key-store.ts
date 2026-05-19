/**
 * Tiny IndexedDB wrapper for persisting a single CryptoKey reference.
 *
 * IndexedDB structured-clones a CryptoKey, so we can store the
 * non-extractable private key directly — the browser keeps the actual
 * key material out of JS reach, and we only ever read back a usable
 * reference for `crypto.subtle.sign()`.
 */

const DB_NAME = 'cs.kiosk.attestation';
const STORE = 'keys';
const KEY = 'device-key';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
  });
}

export async function storeDeviceKey(key: CryptoKey): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(key, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB put failed'));
  });
  db.close();
}

export async function loadDeviceKey(): Promise<CryptoKey | null> {
  const db = await openDb();
  try {
    return await new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as CryptoKey | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error('IDB get failed'));
    });
  } finally {
    db.close();
  }
}

export async function clearDeviceKey(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB delete failed'));
  });
  db.close();
}
