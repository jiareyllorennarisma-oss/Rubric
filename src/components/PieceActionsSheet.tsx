import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  FileText,
  FolderInput,
  PenLine,
  Pin,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { WritingFolder, WritingPiece } from '../types/writing';
import { downloadPiece } from '../utils/metrics';
import { BottomSheetModal } from './BottomSheetModal';

interface PieceActionsSheetProps {
  piece: WritingPiece | null;
  folders: WritingFolder[];
  onClose: () => void;
  onOpen: (pieceId: string) => void;
  onTogglePin: (piece: WritingPiece) => void;
  onMoveFolder: (piece: WritingPiece, folderId: string | null) => void;
  onChangeStatus: (piece: WritingPiece, status: WritingPiece['status']) => void;
  onDelete: (pieceId: string) => void;
}

export const PieceActionsSheet: React.FC<PieceActionsSheetProps> = ({
  piece,
  folders,
  onClose,
  onOpen,
  onTogglePin,
  onMoveFolder,
  onChangeStatus,
  onDelete,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pickingFolder, setPickingFolder] = useState(false);

  if (!piece) return null;

  const handleClose = () => {
    setConfirmingDelete(false);
    setPickingFolder(false);
    onClose();
  };

  return (
    <BottomSheetModal
      open={!!piece}
      onClose={handleClose}
      title={piece.title.trim() || 'Untitled Manuscript'}
      subtitle={
        piece.status === 'finished'
          ? 'Finished work in Vault'
          : piece.status === 'archived'
          ? 'In-progress work in Vault'
          : 'Active draft'
      }
    >
      {pickingFolder ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-[#B8A9A3]">Choose destination folder</span>
            <button
              type="button"
              onClick={() => setPickingFolder(false)}
              className="min-h-[36px] px-2 text-xs font-medium text-[#E5C158] hover:underline"
            >
              Back
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onMoveFolder(piece, null);
              handleClose();
            }}
            className={`flex w-full min-h-[46px] items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
              piece.folderId === null
                ? 'border-[#D4AF37]/50 bg-[#3B1220] text-[#E5C158]'
                : 'border-white/10 bg-[#0B090A]/60 text-[#F5EFE6] hover:bg-[#2B0D17]'
            }`}
          >
            <span>Unfiled Desk</span>
            {piece.folderId === null && <span className="text-xs text-[#D4AF37]">Current</span>}
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                onMoveFolder(piece, folder.id);
                handleClose();
              }}
              className={`flex w-full min-h-[46px] items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                piece.folderId === folder.id
                  ? 'border-[#D4AF37]/50 bg-[#3B1220] text-[#E5C158]'
                  : 'border-white/10 bg-[#0B090A]/60 text-[#F5EFE6] hover:bg-[#2B0D17]'
              }`}
            >
              <span className="truncate">{folder.name}</span>
              {piece.folderId === folder.id && <span className="text-xs text-[#D4AF37]">Current</span>}
            </button>
          ))}
        </div>
      ) : confirmingDelete ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[#E7DDD2]">
            Permanently remove <strong className="text-[#F5EFE6]">{piece.title.trim() || 'Untitled Manuscript'}</strong> from local storage? This cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-white/15 bg-[#0B090A]/70 px-4 py-2.5 text-sm font-medium text-[#F5EFE6] hover:bg-[#2B0D17]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(piece.id);
                handleClose();
              }}
              className="flex-1 min-h-[44px] rounded-xl bg-[#7F1D1D] px-4 py-2.5 text-sm font-semibold text-[#FEE2E2] hover:bg-[#991B1B]"
            >
              Delete Forever
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onOpen(piece.id);
              handleClose();
            }}
            className="flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#2B0D17] px-4 py-3 text-left text-sm font-medium text-[#E5C158] transition-colors hover:bg-[#3B1220]"
          >
            <PenLine className="h-4 w-4 shrink-0" />
            <span>Open in Editor</span>
          </button>

          {piece.status === 'draft' && (
            <button
              type="button"
              onClick={() => {
                onTogglePin(piece);
                handleClose();
              }}
              className="flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-[#0B090A]/60 px-4 py-3 text-left text-sm text-[#F5EFE6] transition-colors hover:bg-[#2B0D17]"
            >
              <Pin className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              <span>{piece.pinned ? 'Unpin from Home' : 'Pin to Home'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPickingFolder(true)}
            className="flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-[#0B090A]/60 px-4 py-3 text-left text-sm text-[#F5EFE6] transition-colors hover:bg-[#2B0D17]"
          >
            <FolderInput className="h-4 w-4 shrink-0 text-[#D4AF37]" />
            <span>Move to Folder</span>
          </button>

          {piece.status === 'draft' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus(piece, 'finished');
                  handleClose();
                }}
                className="flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-[#0B090A]/60 px-4 py-3 text-left text-sm text-[#F5EFE6] transition-colors hover:bg-[#2B0D17]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                <span>Mark Finished &amp; Store in Vault</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus(piece, 'archived');
                  handleClose();
                }}
                className="flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-[#0B090A]/60 px-4 py-3 text-left text-sm text-[#F5EFE6] transition-colors hover:bg-[#2B0D17]"
              >
                <Archive className="h-4 w-4 shrink-0 text-[#B8A9A3]" />
                <span>Keep In-Progress in Vault</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                onChangeStatus(piece, 'draft');
                handleClose();
              }}
              className="flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-[#0B090A]/60 px-4 py-3 text-left text-sm text-[#F5EFE6] transition-colors hover:bg-[#2B0D17]"
            >
              <RotateCcw className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              <span>Restore to Active Drafts</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                downloadPiece(piece, 'md');
                handleClose();
              }}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0B090A]/60 px-3 py-2.5 text-xs font-medium text-[#E7DDD2] hover:bg-[#2B0D17]"
            >
              <Download className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Export .md</span>
            </button>
            <button
              type="button"
              onClick={() => {
                downloadPiece(piece, 'txt');
                handleClose();
              }}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0B090A]/60 px-3 py-2.5 text-xs font-medium text-[#E7DDD2] hover:bg-[#2B0D17]"
            >
              <FileText className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Export .txt</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex w-full min-h-[46px] items-center gap-3 rounded-xl border border-red-900/40 bg-red-950/25 px-4 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-950/45"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span>Delete Manuscript</span>
          </button>
        </div>
      )}
    </BottomSheetModal>
  );
};
