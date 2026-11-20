import React from 'react';
import { ArrowRight, Feather, Folder, FolderPlus, MoreHorizontal, Pin } from 'lucide-react';
import { WritingFolder, WritingPiece } from '../types/writing';
import {
  countWords,
  formatRelativeTime,
  getExcerpt,
  getTimeGreeting,
} from '../utils/metrics';

interface HomeViewProps {
  pieces: WritingPiece[];
  folders: WritingFolder[];
  onOpenPiece: (pieceId: string) => void;
  onNewDraft: (folderId?: string | null) => void;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  onOpenPieceMenu: (piece: WritingPiece) => void;
  onViewAllLibrary: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  pieces,
  folders,
  onOpenPiece,
  onNewDraft,
  onSelectFolder,
  onCreateFolder,
  onOpenPieceMenu,
  onViewAllLibrary,
}) => {
  const activeDrafts = pieces
    .filter((p) => p.status === 'draft')
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

  const featuredDraft = activeDrafts[0] ?? null;
  const recentDrafts = activeDrafts.slice(1, 7);

  const totalDraftWords = activeDrafts.reduce(
    (sum, p) => sum + countWords(p.content),
    0
  );

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Unfiled';
    return folders.find((f) => f.id === folderId)?.name ?? 'Unfiled';
  };

  const countPiecesInFolder = (folderId: string) =>
    pieces.filter((p) => p.status === 'draft' && p.folderId === folderId).length;

  return (
    <div className="space-y-8 pb-8">
      {/* Editorial Greeting & Quiet Desk Summary */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
            {getTimeGreeting()}
          </p>
          <h1 className="mt-1 font-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5EFE6]">
            Your Writing Desk
          </h1>
        </div>
        <p className="font-mono-num text-xs text-[#B8A9A3]">
          {activeDrafts.length} {activeDrafts.length === 1 ? 'active draft' : 'active drafts'} ·{' '}
          {totalDraftWords.toLocaleString()} words
        </p>
      </section>

      {/* Dominant Focal Anchor: Continue Writing Hero Card */}
      <section>
        {featuredDraft ? (
          <div className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#2B0D17] via-[#200A11] to-[#12090B] p-5 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#E5C158]">
                {featuredDraft.pinned && (
                  <>
                    <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Pinned</span>
                    <span aria-hidden="true" className="text-[#D4AF37]/40">·</span>
                  </>
                )}
                <span>{getFolderName(featuredDraft.folderId)}</span>
                <span aria-hidden="true" className="text-[#D4AF37]/40">·</span>
                <span className="font-mono-num">
                  {countWords(featuredDraft.content).toLocaleString()} words
                </span>
                <span aria-hidden="true" className="text-[#D4AF37]/40">·</span>
                <span className="text-[#B8A9A3]">
                  {formatRelativeTime(featuredDraft.updatedAt)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenPieceMenu(featuredDraft)}
                aria-label="Manuscript actions"
                className="flex h-11 w-11 -mr-2 shrink-0 items-center justify-center rounded-xl text-[#B8A9A3] transition-colors hover:bg-white/5 hover:text-[#F5EFE6]"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenPiece(featuredDraft.id)}
              className="mt-2 block w-full text-left group focus-visible:outline-none"
            >
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#F5EFE6] leading-snug group-hover:text-[#E5C158] transition-colors">
                {featuredDraft.title.trim() || 'Untitled Manuscript'}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-[#CFC3BA] line-clamp-3">
                {getExcerpt(featuredDraft.content, 210)}
              </p>
            </button>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenPiece(featuredDraft.id)}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B090A] transition-colors hover:bg-[#E5C158] active:scale-[0.99] whitespace-nowrap"
              >
                <span>Continue Writing</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNewDraft(null)}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#0B090A]/50 px-4 py-2.5 text-sm font-medium text-[#F5EFE6] transition-colors hover:bg-[#3B1220] whitespace-nowrap"
              >
                <Feather className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                <span>New Blank Page</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#2B0D17] to-[#12090B] p-7 text-center">
            <h2 className="font-editorial text-3xl font-semibold text-[#F5EFE6]">
              An Open Page Awaits
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#B8A9A3]">
              Your desk is clear. Begin a new essay, scene, or field note—stored privately on this device.
            </p>
            <button
              type="button"
              onClick={() => onNewDraft(null)}
              className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B090A] transition-colors hover:bg-[#E5C158]"
            >
              <Feather className="h-4 w-4" aria-hidden="true" />
              <span>Start Writing</span>
            </button>
          </div>
        )}
      </section>

      {/* Folders Quick Access */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-editorial text-2xl font-semibold text-[#F5EFE6]">
            Folders
          </h2>
          <button
            type="button"
            onClick={onCreateFolder}
            className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-xs font-medium text-[#E5C158] hover:underline whitespace-nowrap"
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            <span>New Folder</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {folders.map((folder) => {
            const count = countPiecesInFolder(folder.id);
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder.id)}
                className="group flex flex-col justify-between rounded-2xl border border-[#D4AF37]/15 bg-[#1B090F] p-4 text-left transition-colors hover:border-[#D4AF37]/40 hover:bg-[#2B0D17] min-h-[104px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <Folder
                    className="h-4 w-4 text-[#D4AF37] transition-transform group-hover:scale-105"
                    aria-hidden="true"
                  />
                  <span className="font-mono-num text-xs text-[#B8A9A3]">
                    {count}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="font-medium text-sm text-[#F5EFE6] truncate">
                    {folder.name}
                  </div>
                  <div className="mt-0.5 text-xs text-[#B8A9A3] truncate">
                    {count === 1 ? '1 draft' : `${count} drafts`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Drafts List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-editorial text-2xl font-semibold text-[#F5EFE6]">
            Recent Drafts
          </h2>
          {activeDrafts.length > 1 && (
            <button
              type="button"
              onClick={onViewAllLibrary}
              className="min-h-[44px] px-2 text-xs font-medium text-[#E5C158] hover:underline whitespace-nowrap"
            >
              View Library
            </button>
          )}
        </div>

        {recentDrafts.length > 0 ? (
          <div className="divide-y divide-white/[0.07] rounded-2xl border border-white/10 bg-[#140A0D]">
            {recentDrafts.map((piece) => {
              const words = countWords(piece.content);
              return (
                <div
                  key={piece.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[#240B12]/70 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <button
                    type="button"
                    onClick={() => onOpenPiece(piece.id)}
                    className="min-w-0 flex-1 text-left py-1 focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-editorial text-xl font-medium text-[#F5EFE6] truncate">
                        {piece.title.trim() || 'Untitled Manuscript'}
                      </h3>
                      {piece.pinned && (
                        <Pin
                          className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]"
                          aria-label="Pinned"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#B8A9A3] truncate">
                      {getExcerpt(piece.content, 95)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[#9C8D87]">
                      <span>{getFolderName(piece.folderId)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{words.toLocaleString()} words</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeTime(piece.updatedAt)}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPieceMenu(piece)}
                    aria-label={`Actions for ${piece.title || 'Untitled Manuscript'}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#B8A9A3] transition-colors hover:bg-white/5 hover:text-[#F5EFE6]"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          featuredDraft && (
            <p className="rounded-2xl border border-white/10 bg-[#140A0D] px-5 py-6 text-sm text-[#B8A9A3]">
              Your featured manuscript sits at the top of the desk. Start a new blank page whenever a fresh thought arrives.
            </p>
          )
        )}
      </section>
    </div>
  );
};
