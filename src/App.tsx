import { useCallback, useEffect, useState } from 'react';
import { Archive, BookOpen, Feather, Home, PenLine } from 'lucide-react';
import { EditorView } from './components/EditorView';
import { FolderFormModal } from './components/FolderFormModal';
import { HomeView } from './components/HomeView';
import { LaunchScreen } from './components/LaunchScreen';
import { LibraryView } from './components/LibraryView';
import { OfflineBanner } from './components/OfflineBanner';
import { PieceActionsSheet } from './components/PieceActionsSheet';
import { PWAInstallButton } from './components/PWAInstallButton';
import { VaultView } from './components/VaultView';
import {
  DEFAULT_SETTINGS,
  initializeWorkspace,
  persistFolder,
  persistPiece,
  persistSettings,
  removeFolderAndUnassign,
  removePiece,
} from './storage/localDb';
import {
  AppTab,
  WriterSettings,
  WritingFolder,
  WritingPiece,
} from './types/writing';

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);

  const [pieces, setPieces] = useState<WritingPiece[]>([]);
  const [folders, setFolders] = useState<WritingFolder[]>([]);
  const [settings, setSettings] = useState<WriterSettings>(DEFAULT_SETTINGS);

  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [libraryFolderFilter, setLibraryFolderFilter] = useState<
    string | 'all' | 'unfiled'
  >('all');
  const [activePieceId, setActivePieceId] = useState<string | null>(null);

  const [menuPiece, setMenuPiece] = useState<WritingPiece | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<WritingFolder | null>(null);

  useEffect(() => {
    let mounted = true;
    void initializeWorkspace().then((data) => {
      if (!mounted) return;
      setFolders(data.folders);
      setPieces(data.pieces);
      setSettings(data.settings);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleUpdatePiece = useCallback(async (updated: WritingPiece) => {
    setPieces((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      if (exists) {
        return prev.map((p) => (p.id === updated.id ? updated : p));
      }
      return [updated, ...prev];
    });
    await persistPiece(updated);
  }, []);

  const handleNewDraft = useCallback(
    async (folderId: string | null = null) => {
      const now = Date.now();
      const created: WritingPiece = {
        id: generateId('piece'),
        title: '',
        content: '',
        folderId: folderId ?? null,
        status: 'draft',
        pinned: false,
        createdAt: now,
        updatedAt: now,
        finishedAt: null,
      };
      setPieces((prev) => [created, ...prev]);
      setActivePieceId(created.id);
      await persistPiece(created);
    },
    []
  );

  const handleTogglePin = useCallback(
    async (piece: WritingPiece) => {
      const updated: WritingPiece = {
        ...piece,
        pinned: !piece.pinned,
        updatedAt: Date.now(),
      };
      await handleUpdatePiece(updated);
    },
    [handleUpdatePiece]
  );

  const handleMoveFolder = useCallback(
    async (piece: WritingPiece, folderId: string | null) => {
      const updated: WritingPiece = {
        ...piece,
        folderId,
        updatedAt: Date.now(),
      };
      await handleUpdatePiece(updated);
    },
    [handleUpdatePiece]
  );

  const handleChangeStatus = useCallback(
    async (piece: WritingPiece, status: WritingPiece['status']) => {
      const now = Date.now();
      const updated: WritingPiece = {
        ...piece,
        status,
        pinned: status === 'draft' ? piece.pinned : false,
        updatedAt: now,
        finishedAt: status === 'finished' ? now : null,
      };
      await handleUpdatePiece(updated);
    },
    [handleUpdatePiece]
  );

  const handleDeletePiece = useCallback(async (pieceId: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
    setActivePieceId((curr) => (curr === pieceId ? null : curr));
    await removePiece(pieceId);
  }, []);

  const handleSaveFolder = useCallback(
    async (name: string, description: string, folderId?: string) => {
      const now = Date.now();
      if (folderId) {
        const existing = folders.find((f) => f.id === folderId);
        if (!existing) return;
        const updated: WritingFolder = {
          ...existing,
          name,
          description: description || undefined,
          updatedAt: now,
        };
        setFolders((prev) => prev.map((f) => (f.id === folderId ? updated : f)));
        await persistFolder(updated);
      } else {
        const created: WritingFolder = {
          id: generateId('folder'),
          name,
          description: description || undefined,
          createdAt: now,
          updatedAt: now,
        };
        setFolders((prev) => [...prev, created]);
        await persistFolder(created);
      }
    },
    [folders]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const affected = pieces
        .filter((p) => p.folderId === folderId)
        .map((p) => ({ ...p, folderId: null }));

      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setPieces((prev) =>
        prev.map((p) => (p.folderId === folderId ? { ...p, folderId: null } : p))
      );
      if (libraryFolderFilter === folderId) {
        setLibraryFolderFilter('all');
      }
      await removeFolderAndUnassign(folderId, affected);
    },
    [pieces, libraryFolderFilter]
  );

  const handleUpdateSettings = useCallback((nextSettings: WriterSettings) => {
    setSettings(nextSettings);
    void persistSettings(nextSettings);
  }, []);

  const activePiece = activePieceId
    ? pieces.find((p) => p.id === activePieceId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-[#0B090A] text-[#F5EFE6]">
      {showSplash && <LaunchScreen onComplete={handleSplashComplete} />}

      {activePiece ? (
        <EditorView
          piece={activePiece}
          folders={folders}
          settings={settings}
          onUpdatePiece={handleUpdatePiece}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setActivePieceId(null)}
        />
      ) : (
        <div className="flex min-h-screen flex-col">
          {/* Clean Top Bar: non-sticky on mobile to preserve 85%+ scrollable area; 3-zone layout on desktop */}
          <header className="border-b border-white/[0.07] bg-[#0B090A] md:sticky md:top-0 md:z-30 md:bg-[#0B090A]/90 md:backdrop-blur-md pt-safe">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
              {/* Zone 1: Single-line Brand Wordmark */}
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none"
              >
                <img
                  src="/icon.svg"
                  alt=""
                  className="h-7 w-7 rounded-lg border border-[#D4AF37]/30"
                  referrerPolicy="no-referrer"
                />
                <span className="font-editorial text-2xl font-semibold tracking-tight text-[#F5EFE6]">
                  Rubric
                </span>
              </button>

              {/* Zone 2: Clean Desktop Navigation Links */}
              <nav
                aria-label="Primary"
                className="hidden md:flex items-center gap-7 text-sm font-medium"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className={`py-2 transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'home'
                      ? 'text-[#E5C158] border-b border-[#D4AF37]'
                      : 'text-[#B8A9A3] hover:text-[#F5EFE6]'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className={`py-2 transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'library'
                      ? 'text-[#E5C158] border-b border-[#D4AF37]'
                      : 'text-[#B8A9A3] hover:text-[#F5EFE6]'
                  }`}
                >
                  Library
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vault')}
                  className={`py-2 transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'vault'
                      ? 'text-[#E5C158] border-b border-[#D4AF37]'
                      : 'text-[#B8A9A3] hover:text-[#F5EFE6]'
                  }`}
                >
                  Vault
                </button>
              </nav>

              {/* Zone 3: Install Action (when eligible) + Primary New Draft CTA */}
              <div className="flex items-center gap-2.5 shrink-0">
                <PWAInstallButton compact />
                <button
                  type="button"
                  onClick={() =>
                    handleNewDraft(
                      activeTab === 'library' &&
                        libraryFolderFilter !== 'all' &&
                        libraryFolderFilter !== 'unfiled'
                        ? libraryFolderFilter
                        : null
                    )
                  }
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs sm:text-sm font-semibold text-[#0B090A] transition-colors hover:bg-[#E5C158] whitespace-nowrap shrink-0"
                >
                  <Feather className="h-4 w-4" aria-hidden="true" />
                  <span>New Draft</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Workspace Content */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
            {!ready ? (
              <div className="py-20 text-center text-sm text-[#B8A9A3]">
                Opening your desk…
              </div>
            ) : activeTab === 'home' ? (
              <HomeView
                pieces={pieces}
                folders={folders}
                onOpenPiece={(id) => setActivePieceId(id)}
                onNewDraft={handleNewDraft}
                onSelectFolder={(folderId) => {
                  setLibraryFolderFilter(folderId);
                  setActiveTab('library');
                }}
                onCreateFolder={() => {
                  setEditingFolder(null);
                  setFolderModalOpen(true);
                }}
                onOpenPieceMenu={(piece) => setMenuPiece(piece)}
                onViewAllLibrary={() => {
                  setLibraryFolderFilter('all');
                  setActiveTab('library');
                }}
              />
            ) : activeTab === 'library' ? (
              <LibraryView
                pieces={pieces}
                folders={folders}
                selectedFolderId={libraryFolderFilter}
                onSelectFolder={(id) => setLibraryFolderFilter(id)}
                onOpenPiece={(id) => setActivePieceId(id)}
                onNewDraft={handleNewDraft}
                onCreateFolder={() => {
                  setEditingFolder(null);
                  setFolderModalOpen(true);
                }}
                onEditFolder={(folder) => {
                  setEditingFolder(folder);
                  setFolderModalOpen(true);
                }}
                onOpenPieceMenu={(piece) => setMenuPiece(piece)}
              />
            ) : (
              <VaultView
                pieces={pieces}
                folders={folders}
                onOpenPiece={(id) => setActivePieceId(id)}
                onOpenPieceMenu={(piece) => setMenuPiece(piece)}
              />
            )}
          </main>

          {/* Mobile Thumb-Zone Bottom Navigation Bar (<= 10% viewport height) */}
          <nav
            aria-label="Mobile Navigation"
            className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#D4AF37]/15 bg-[#12090C]/95 backdrop-blur-md pb-safe md:hidden"
          >
            <div className="grid h-16 grid-cols-4 items-center">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'home' ? 'text-[#E5C158]' : 'text-[#9C8D87]'
                }`}
              >
                <Home className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium tracking-tight">Home</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'library' ? 'text-[#E5C158]' : 'text-[#9C8D87]'
                }`}
              >
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium tracking-tight">Library</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className={`flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'vault' ? 'text-[#E5C158]' : 'text-[#9C8D87]'
                }`}
              >
                <Archive className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium tracking-tight">Vault</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleNewDraft(
                    activeTab === 'library' &&
                      libraryFolderFilter !== 'all' &&
                      libraryFolderFilter !== 'unfiled'
                      ? libraryFolderFilter
                      : null
                  )
                }
                className="flex h-full flex-col items-center justify-center gap-1 text-[#D4AF37] active:scale-95 transition-transform"
              >
                <PenLine className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-tight">Write</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      <OfflineBanner />

      <PieceActionsSheet
        piece={menuPiece}
        folders={folders}
        onClose={() => setMenuPiece(null)}
        onOpen={(id) => setActivePieceId(id)}
        onTogglePin={handleTogglePin}
        onMoveFolder={handleMoveFolder}
        onChangeStatus={handleChangeStatus}
        onDelete={handleDeletePiece}
      />

      <FolderFormModal
        open={folderModalOpen}
        editingFolder={editingFolder}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleSaveFolder}
        onDelete={handleDeleteFolder}
      />
    </div>
  );
}
