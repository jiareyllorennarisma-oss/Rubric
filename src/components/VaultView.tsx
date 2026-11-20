import React, { useMemo, useState } from 'react';
import { Archive, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { WritingFolder, WritingPiece } from '../types/writing';
import { countWords, formatFullDate, getExcerpt } from '../utils/metrics';

interface VaultViewProps {
  pieces: WritingPiece[];
  folders: WritingFolder[];
  onOpenPiece: (pieceId: string) => void;
  onOpenPieceMenu: (piece: WritingPiece) => void;
}

type VaultFilter = 'all' | 'finished' | 'archived';

export const VaultView: React.FC<VaultViewProps> = ({
  pieces,
  folders,
  onOpenPiece,
  onOpenPieceMenu,
}) => {
  const [filter, setFilter] = useState<VaultFilter>('all');

  const vaultPieces = useMemo(
    () =>
      pieces
        .filter((p) => p.status === 'finished' || p.status === 'archived')
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [pieces]
  );

  const finishedCount = vaultPieces.filter((p) => p.status === 'finished').length;
  const archivedCount = vaultPieces.filter((p) => p.status === 'archived').length;
  const totalVaultWords = vaultPieces.reduce(
    (sum, p) => sum + countWords(p.content),
    0
  );

  const visiblePieces = useMemo(() => {
    if (filter === 'all') return vaultPieces;
    return vaultPieces.filter((p) => p.status === filter);
  }, [vaultPieces, filter]);

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Unfiled';
    return folders.find((f) => f.id === folderId)?.name ?? 'Unfiled';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Vault Summary Banner */}
      <section className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#2B0D17] via-[#1C0910] to-[#0E090A] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
              Personal Archive
            </p>
            <h1 className="mt-1 font-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5EFE6]">
              The Manuscript Vault
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-[#CFC3BA]">
              A quiet repository for completed pieces and treasured in-progress works kept off your active desk.
            </p>
          </div>
          <div className="font-mono-num text-xs text-[#E5C158] sm:text-right">
            <div>{finishedCount} finished · {archivedCount} in-progress</div>
            <div className="mt-1 text-[#B8A9A3]">
              {totalVaultWords.toLocaleString()} archived words
            </div>
          </div>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="mt-5 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#0B090A]/70 p-1">
          {(
            [
              ['all', `All (${vaultPieces.length})`],
              ['finished', `Finished (${finishedCount})`],
              ['archived', `In-Progress (${archivedCount})`],
            ] as [VaultFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filter === key
                  ? 'bg-[#3B1220] text-[#E5C158]'
                  : 'text-[#B8A9A3] hover:text-[#F5EFE6]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Vault Manuscripts List */}
      {visiblePieces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visiblePieces.map((piece) => {
            const words = countWords(piece.content);
            const isFinished = piece.status === 'finished';
            return (
              <div
                key={piece.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#140A0D] p-5 transition-colors hover:border-[#D4AF37]/30 hover:bg-[#1E0A11]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1.5 text-[#E5C158]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Finished</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#B8A9A3]">
                          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>In-Progress</span>
                        </span>
                      )}
                      <span aria-hidden="true" className="text-white/25">·</span>
                      <span className="text-[#9C8D87]">{getFolderName(piece.folderId)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenPieceMenu(piece)}
                      aria-label={`Actions for ${piece.title || 'Untitled Manuscript'}`}
                      className="flex h-11 w-11 -mr-2 -mt-2 shrink-0 items-center justify-center rounded-xl text-[#B8A9A3] hover:bg-white/5 hover:text-[#F5EFE6]"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPiece(piece.id)}
                    className="mt-1.5 block w-full text-left focus-visible:outline-none group"
                  >
                    <h2 className="font-editorial text-2xl font-semibold text-[#F5EFE6] leading-snug group-hover:text-[#E5C158] transition-colors">
                      {piece.title.trim() || 'Untitled Manuscript'}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#B8A9A3] line-clamp-3">
                      {getExcerpt(piece.content, 160)}
                    </p>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-[#9C8D87]">
                  <span className="font-mono-num">{words.toLocaleString()} words</span>
                  <span>
                    {isFinished && piece.finishedAt
                      ? `Completed ${formatFullDate(piece.finishedAt)}`
                      : `Archived ${formatFullDate(piece.updatedAt)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#140A0D] px-6 py-12 text-center">
          <h3 className="font-editorial text-2xl font-semibold text-[#F5EFE6]">
            No vaulted manuscripts here
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[#B8A9A3]">
            When a piece is finished or ready to rest off your desk, move it into the Vault from the editor or manuscript menu.
          </p>
        </div>
      )}
    </div>
  );
};
