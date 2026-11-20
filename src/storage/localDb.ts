import { WriterSettings, WritingFolder, WritingPiece } from '../types/writing';

const DB_NAME = 'rubric_sanctuary_db';
const DB_VERSION = 1;
const STORE_PIECES = 'pieces';
const STORE_FOLDERS = 'folders';
const STORE_META = 'meta';

const LS_FALLBACK_KEY = 'rubric_sanctuary_fallback_v1';
const SETTINGS_KEY = 'writer_settings';
const INITIALIZED_KEY = 'workspace_initialized';

export const DEFAULT_SETTINGS: WriterSettings = {
  font: 'serif',
  fontSize: 'md',
  surface: 'obsidian',
};

function createStarterData(): { folders: WritingFolder[]; pieces: WritingPiece[] } {
  const now = Date.now();
  const hour = 3600 * 1000;
  const day = 24 * hour;

  const folders: WritingFolder[] = [
    {
      id: 'folder-essays',
      name: 'Essays',
      description: 'Long-form reflections and cultural criticism',
      createdAt: now - 12 * day,
      updatedAt: now - 2 * hour,
    },
    {
      id: 'folder-fiction',
      name: 'Fiction',
      description: 'Short stories, scenes, and character sketches',
      createdAt: now - 10 * day,
      updatedAt: now - 1 * day,
    },
    {
      id: 'folder-notes',
      name: 'Field Notes',
      description: 'Daily observations and unedited fragments',
      createdAt: now - 7 * day,
      updatedAt: now - 3 * day,
    },
  ];

  const pieces: WritingPiece[] = [
    {
      id: 'piece-starter-1',
      title: 'Notes on Quiet Rooms & Unhurried Prose',
      content: `There is a distinct cadence that only returns when notifications fall silent and the page stops asking to be formatted. Good sentences rarely arrive under bright fluorescent pressure; they surface when the desk feels calm enough to wait for the right verb.

Start with a concrete detail—the weight of a brass pen, rain tapping against a shuttered window, the half-remembered opening line of a letter you never mailed. Everything else in an essay grows outward from one honest image.`,
      folderId: 'folder-essays',
      status: 'draft',
      pinned: true,
      createdAt: now - 3 * day,
      updatedAt: now - 25 * 60 * 1000,
      finishedAt: null,
    },
    {
      id: 'piece-starter-2',
      title: 'The Station Master at Verrier',
      content: `At half past four the mist settled low enough to hide the iron footbridge. Henri turned the brass lantern wick down a fraction—not enough to dim the platform, only enough to stop the glass from smoking before the 4:42 express cleared the bend.

In his coat pocket rested two folded telegrams from Marseille, neither of them opened since Tuesday.`,
      folderId: 'folder-fiction',
      status: 'draft',
      pinned: false,
      createdAt: now - 5 * day,
      updatedAt: now - 18 * hour,
      finishedAt: null,
    },
    {
      id: 'piece-starter-3',
      title: 'Winter Inventory of Small Habits',
      content: `1. Keep a notebook within arm's reach before checking any screen.
2. Read three pages of poetry before drafting prose; rhythm is contagious.
3. Never delete a paragraph at night—move it to the vault and judge it with morning eyes.`,
      folderId: 'folder-notes',
      status: 'archived',
      pinned: false,
      createdAt: now - 9 * day,
      updatedAt: now - 4 * day,
      finishedAt: null,
    },
    {
      id: 'piece-starter-4',
      title: 'Letters from the Cedar Press',
      content: `When the old letterpress finally stopped humming at dusk, the studio smelled of linseed ink, damp cotton rag, and warm pine shavings. We stacked the last folio sheets beside the north window to dry overnight.

Print teaches patience that digital screens erase: once lead type is locked in the chase, every comma carries physical weight. You measure a sentence not by how fast it scrolls, but by how cleanly it rests on the paper.`,
      folderId: 'folder-essays',
      status: 'finished',
      pinned: false,
      createdAt: now - 14 * day,
      updatedAt: now - 6 * day,
      finishedAt: now - 6 * day,
    },
  ];

  return { folders, pieces };
}

interface FallbackState {
  initialized: boolean;
  folders: WritingFolder[];
  pieces: WritingPiece[];
  settings: WriterSettings;
}

function readFallback(): FallbackState {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (raw) {
      return JSON.parse(raw) as FallbackState;
    }
  } catch {
    // Ignore storage read errors
  }
  return {
    initialized: false,
    folders: [],
    pieces: [],
    settings: DEFAULT_SETTINGS,
  };
}

function writeFallback(state: FallbackState): void {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PIECES)) {
        db.createObjectStore(STORE_PIECES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function idbGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

function idbGetMeta<T>(db: IDBDatabase, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const store = tx.objectStore(STORE_META);
    const req = store.get(key);
    req.onsuccess = () => {
      const row = req.result as { key: string; value: T } | undefined;
      resolve(row ? row.value : null);
    };
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, storeName: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbDelete(db: IDBDatabase, storeName: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function initializeWorkspace(): Promise<{
  folders: WritingFolder[];
  pieces: WritingPiece[];
  settings: WriterSettings;
}> {
  try {
    const db = await openDB();
    const initialized = await idbGetMeta<boolean>(db, INITIALIZED_KEY);

    if (!initialized) {
      const starter = createStarterData();
      const tx = db.transaction([STORE_FOLDERS, STORE_PIECES, STORE_META], 'readwrite');
      for (const f of starter.folders) tx.objectStore(STORE_FOLDERS).put(f);
      for (const p of starter.pieces) tx.objectStore(STORE_PIECES).put(p);
      tx.objectStore(STORE_META).put({ key: INITIALIZED_KEY, value: true });
      tx.objectStore(STORE_META).put({ key: SETTINGS_KEY, value: DEFAULT_SETTINGS });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return {
        folders: starter.folders,
        pieces: starter.pieces,
        settings: DEFAULT_SETTINGS,
      };
    }

    const [folders, pieces, savedSettings] = await Promise.all([
      idbGetAll<WritingFolder>(db, STORE_FOLDERS),
      idbGetAll<WritingPiece>(db, STORE_PIECES),
      idbGetMeta<WriterSettings>(db, SETTINGS_KEY),
    ]);

    return {
      folders,
      pieces,
      settings: savedSettings ? { ...DEFAULT_SETTINGS, ...savedSettings } : DEFAULT_SETTINGS,
    };
  } catch {
    const fallback = readFallback();
    if (!fallback.initialized) {
      const starter = createStarterData();
      const nextState: FallbackState = {
        initialized: true,
        folders: starter.folders,
        pieces: starter.pieces,
        settings: DEFAULT_SETTINGS,
      };
      writeFallback(nextState);
      return {
        folders: starter.folders,
        pieces: starter.pieces,
        settings: DEFAULT_SETTINGS,
      };
    }
    return {
      folders: fallback.folders,
      pieces: fallback.pieces,
      settings: { ...DEFAULT_SETTINGS, ...fallback.settings },
    };
  }
}

export async function persistPiece(piece: WritingPiece): Promise<void> {
  try {
    const db = await openDB();
    await idbPut(db, STORE_PIECES, piece);
  } catch {
    const fallback = readFallback();
    const idx = fallback.pieces.findIndex((p) => p.id === piece.id);
    if (idx >= 0) {
      fallback.pieces[idx] = piece;
    } else {
      fallback.pieces.unshift(piece);
    }
    writeFallback(fallback);
  }
}

export async function removePiece(pieceId: string): Promise<void> {
  try {
    const db = await openDB();
    await idbDelete(db, STORE_PIECES, pieceId);
  } catch {
    const fallback = readFallback();
    fallback.pieces = fallback.pieces.filter((p) => p.id !== pieceId);
    writeFallback(fallback);
  }
}

export async function persistFolder(folder: WritingFolder): Promise<void> {
  try {
    const db = await openDB();
    await idbPut(db, STORE_FOLDERS, folder);
  } catch {
    const fallback = readFallback();
    const idx = fallback.folders.findIndex((f) => f.id === folder.id);
    if (idx >= 0) {
      fallback.folders[idx] = folder;
    } else {
      fallback.folders.push(folder);
    }
    writeFallback(fallback);
  }
}

export async function removeFolderAndUnassign(
  folderId: string,
  affectedPieces: WritingPiece[]
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_FOLDERS, STORE_PIECES], 'readwrite');
    tx.objectStore(STORE_FOLDERS).delete(folderId);
    const piecesStore = tx.objectStore(STORE_PIECES);
    for (const p of affectedPieces) {
      piecesStore.put(p);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const fallback = readFallback();
    fallback.folders = fallback.folders.filter((f) => f.id !== folderId);
    fallback.pieces = fallback.pieces.map((p) =>
      p.folderId === folderId ? { ...p, folderId: null } : p
    );
    writeFallback(fallback);
  }
}

export async function persistSettings(settings: WriterSettings): Promise<void> {
  try {
    const db = await openDB();
    await idbPut(db, STORE_META, { key: SETTINGS_KEY, value: settings });
  } catch {
    const fallback = readFallback();
    fallback.settings = settings;
    writeFallback(fallback);
  }
}
