import React, { useMemo, useState } from 'react';
import {
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { WritingFolder, WritingPiece } from '../types/writing';
import { countWords, formatRelativeTime, getExcerpt } from '../utils/metrics';

interface LibraryViewProps {
  pieces: WritingPiece[];
  folders: WritingFolder[];
  selectedFolderId: string | 'all' | 'unfiled';
  onSelectFolder: (folderId: string | 'all' | 'unfiled') => void;
  onOpenPiece: (pieceId: string) => void;
  onNewDraft: (folderId?: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: WritingFolder) => void;
  onOpenPieceMenu: (piece: WritingPiece) => void;
}

type SortMode = 'recent' | 'title' | 'words';

export const LibraryView: React.FC<LibraryViewProps> = ({
  pieces,
  folders,
  selectedFolderId,
  onSelectFolder,
  onOpenPiece,
  onNewDraft,
  onCreateFolder,
  onEditFolder,
  onOpenPieceMenu,
}) => {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const activeDrafts = useMemo(
    () => pieces.filter((p) => p.status === 'draft'),
    [pieces]
  );

  const selectedFolder =
    selectedFolderId !== 'all' && selectedFolderId !== 'unfiled'
      ? folders.find((f) => f.id === selectedFolderId) ?? null
      : null;

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = activeDrafts.filter((p) => {
      if (selectedFolderId === 'unfiled' && p.folderId !== null) return false;
      if (
        selectedFolderId !== 'all' &&
        selectedFolderId !== 'unfiled' &&
        p.folderId !== selectedFolderId
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'title') {
        return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
      }
      if (sortMode === 'words') {
        return countWords(b.content) - countWords(a.content);
      }
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [activeDrafts, selectedFolderId, query, sortMode]);

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Unfiled';
    return folders.find((f) => f.id === folderId)?.name ?? 'Unfiled';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5EFE6]">
            {selectedFolder ? selectedFolder.name : selectedFolderId === 'unfiled' ? 'Unfiled Desk' : 'Library'}
          </h1>
          <p className="mt-1 text-xs text-[#B8A9A3]">
            {selectedFolder?.description
              ? selectedFolder.description
              : `${filteredDrafts.length} ${filteredDrafts.length === 1 ? 'manuscript' : 'manuscripts'} stored locally`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedFolder && (
            <button
              type="button"
              onClick={() => onEditFolder(selectedFolder)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#D4AF37]/25 bg-[#1B090F] px-3.5 py-2 text-xs font-medium text-[#E5C158] hover:bg-[#2B0D17] whitespace-nowrap"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Folder</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCreateFolder}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#1B090F] px-3.5 py-2 text-xs font-medium text-[#F5EFE6] hover:bg-[#2B0D17] whitespace-nowrap"
          >
            <FolderPlus className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8A9A3]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drafts by title or line…"
            aria-label="Search drafts"
            className="w-full min-h-[46px] rounded-xl border border-white/10 bg-[#140A0D] pl-10 pr-10 py-2.5 text-sm text-[#F5EFE6] placeholder-[#9C8D87] focus:border-[#D4AF37]/50 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#B8A9A3] hover:text-[#F5EFE6]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#140A0D] p-1 self-start sm:self-auto">
          {(
            [
              ['recent', 'Recent'],
              ['title', 'A–Z'],
              ['words', 'Length'],
            ] as [SortMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSortMode(mode)}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                sortMode === mode
                  ? 'bg-[#3B1220] text-[#E5C158]'
                  : 'text-[#B8A9A3] hover:text-[#F5EFE6]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Folder Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onSelectFolder('all')}
          className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            selectedFolderId === 'all'
              ? 'bg-[#D4AF37] text-[#0B090A] font-semibold'
              : 'border border-white/10 bg-[#1B090F] text-[#CFC3BA] hover:bg-[#2B0D17]'
          }`}
        >
          All ({activeDrafts.length})
        </button>

        {folders.map((folder) => {
          const count = activeDrafts.filter((p) => p.folderId === folder.id).length;
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedFolderId === folder.id
                  ? 'bg-[#D4AF37] text-[#0B090A] font-semibold'
                  : 'border border-white/10 bg-[#1B090F] text-[#CFC3BA] hover:bg-[#2B0D17]'
              }`}
            >
              {folder.name} ({count})
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onSelectFolder('unfiled')}
          className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            selectedFolderId === 'unfiled'
              ? 'bg-[#D4AF37] text-[#0B090A] font-semibold'
              : 'border border-white/10 bg-[#1B090F] text-[#CFC3BA] hover:bg-[#2B0D17]'
          }`}
        >
          Unfiled ({activeDrafts.filter((p) => p.folderId === null).length})
        </button>
      </div>

      {/* Manuscripts Grid / List */}
      {filteredDrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDrafts.map((piece) => {
            const words = countWords(piece.content);
            return (
              <div
                key={piece.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#160A0E] p-5 transition-colors hover:border-[#D4AF37]/30 hover:bg-[#220B13]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
                      <span>{getFolderName(piece.folderId)}</span>
                      {piece.pinned && (
                        <>
                          <span aria-hidden="true" className="text-[#D4AF37]/40">·</span>
                          <Pin className="h-3 w-3" aria-label="Pinned" />
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPieceMenu(piece)}
                      aria-label={`Options for ${piece.title || 'Untitled Manuscript'}`}
                      className="flex h-11 w-11 -mr-2 -mt-2 shrink-0 items-center justify-center rounded-xl text-[#B8A9A3] hover:bg-white/5 hover:text-[#F5EFE6]"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPiece(piece.id)}
                    className="mt-1 block w-full text-left focus-visible:outline-none group"
                  >
                    <h3 className="font-editorial text-2xl font-semibold text-[#F5EFE6] leading-snug group-hover:text-[#E5C158] transition-colors line-clamp-2">
                      {piece.title.trim() || 'Untitled Manuscript'}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#B8A9A3] line-clamp-3">
                      {getExcerpt(piece.content, 130)}
                    </p>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-[#9C8D87]">
                  <span className="font-mono-num">{words.toLocaleString()} words</span>
                  <span>{formatRelativeTime(piece.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#140A0D] px-6 py-12 text-center">
          <h3 className="font-editorial text-2xl font-semibold text-[#F5EFE6]">
            {query ? 'No matching manuscripts' : 'This shelf is empty'}
          </h3>
          <p className="mt-1.5 text-sm text-[#B8A9A3]">
            {query
              ? 'Try another phrase or clear your search filter.'
              : 'Start a fresh draft directly inside this collection.'}
          </p>
          <button
            type="button"
            onClick={() =>
              onNewDraft(
                selectedFolderId !== 'all' && selectedFolderId !== 'unfiled'
                  ? selectedFolderId
                  : null
              )
            }
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B090A] hover:bg-[#E5C158]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Draft Here</span>
          </button>
        </div>
      )}
    </div>
  );
};
