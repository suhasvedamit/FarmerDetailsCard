import {
  CardTemplate,
  removeCustomCardTemplate,
  setCustomCardTemplates,
  upsertCustomCardTemplate,
} from './cardTemplates';

const DB_NAME = 'farmer_id_card_custom_designs_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_templates';
const LOCAL_STORAGE_TEMPLATES_KEY = 'farmer_id_custom_templates_v1';
const LOCAL_STORAGE_SELECTED_ID_KEY = 'farmer_id_selected_template_v1';

let hydrationPromise: Promise<CardTemplate[]> | null = null;
let hasHydrated = false;

function isIndexedDbSupported(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openTemplatesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbSupported()) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

function sanitizeStoredTemplate(raw: unknown): CardTemplate | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<CardTemplate>;
  if (!obj.id || !obj.name || !obj.frontUrl) return null;

  return {
    id: String(obj.id),
    name: String(obj.name),
    folderName: String(obj.folderName || obj.id),
    frontUrl: String(obj.frontUrl),
    backUrl: String(obj.backUrl || obj.frontUrl),
    url: String(obj.url || obj.frontUrl),
    hasSeparateBack: Boolean(obj.hasSeparateBack),
    isCustom: true,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
    updatedAt: typeof obj.updatedAt === 'number' ? obj.updatedAt : Date.now(),
    rawFrontUrl: typeof obj.rawFrontUrl === 'string' ? obj.rawFrontUrl : undefined,
    rawBackUrl: typeof obj.rawBackUrl === 'string' ? obj.rawBackUrl : undefined,
    customStyle: obj.customStyle,
  };
}

function readFromLocalStorageFallback(): CardTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeStoredTemplate)
      .filter((t): t is CardTemplate => t !== null);
  } catch {
    return [];
  }
}

function writeToLocalStorageFallback(templates: CardTemplate[]): void {
  if (typeof window === 'undefined') return;
  const compact = templates.map(({ rawFrontUrl: _rf, rawBackUrl: _rb, ...rest }) => rest);
  window.localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(compact));
}

export async function loadCustomTemplatesFromStorage(): Promise<CardTemplate[]> {
  if (isIndexedDbSupported()) {
    try {
      const db = await openTemplatesDb();
      const rows = await new Promise<CardTemplate[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const sanitized = (Array.isArray(req.result) ? req.result : [])
            .map(sanitizeStoredTemplate)
            .filter((t): t is CardTemplate => t !== null);
          resolve(sanitized);
        };
        req.onerror = () => reject(req.error || new Error('Failed to read custom templates'));
      });
      db.close();

      if (rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[CustomTemplates] IndexedDB read failed, using localStorage fallback:', err);
    }
  }

  return readFromLocalStorageFallback();
}

export async function saveCustomTemplateToStorage(template: CardTemplate): Promise<void> {
  const normalized: CardTemplate = { ...template, isCustom: true };

  if (isIndexedDbSupported()) {
    try {
      const db = await openTemplatesDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(normalized);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Failed to save custom template'));
      });
      db.close();
      return;
    } catch (err) {
      console.warn('[CustomTemplates] IndexedDB write failed, trying localStorage fallback:', err);
    }
  }

  const existing = readFromLocalStorageFallback().filter((t) => t.id !== normalized.id);
  writeToLocalStorageFallback([normalized, ...existing]);
}

export async function deleteCustomTemplateFromStorage(templateId: string): Promise<void> {
  if (isIndexedDbSupported()) {
    try {
      const db = await openTemplatesDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(templateId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Failed to delete custom template'));
      });
      db.close();
    } catch (err) {
      console.warn('[CustomTemplates] IndexedDB delete failed:', err);
    }
  }

  try {
    const existing = readFromLocalStorageFallback();
    if (existing.some((t) => t.id === templateId)) {
      writeToLocalStorageFallback(existing.filter((t) => t.id !== templateId));
    }
  } catch {
    // ignore fallback cleanup error
  }
}

export function hydrateCustomCardTemplates(): Promise<CardTemplate[]> {
  if (hasHydrated) {
    return hydrationPromise || Promise.resolve([]);
  }
  if (!hydrationPromise) {
    hydrationPromise = loadCustomTemplatesFromStorage()
      .then((templates) => {
        hasHydrated = true;
        setCustomCardTemplates(templates);
        return templates;
      })
      .catch((err) => {
        console.warn('[CustomTemplates] Hydration failed:', err);
        hasHydrated = true;
        return [];
      });
  }
  return hydrationPromise;
}

export function isCustomTemplatesHydrated(): boolean {
  return hasHydrated;
}

export async function saveAndRegisterCustomTemplate(template: CardTemplate): Promise<void> {
  upsertCustomCardTemplate(template);
  await saveCustomTemplateToStorage(template);
}

export async function deleteAndUnregisterCustomTemplate(templateId: string): Promise<void> {
  removeCustomCardTemplate(templateId);
  await deleteCustomTemplateFromStorage(templateId);
}

export function getSavedSelectedTemplateId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LOCAL_STORAGE_SELECTED_ID_KEY);
  } catch {
    return null;
  }
}

export function persistSelectedTemplateId(templateId: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (templateId) {
      window.localStorage.setItem(LOCAL_STORAGE_SELECTED_ID_KEY, templateId);
    }
  } catch {
    // ignore storage quota / privacy mode errors
  }
}

