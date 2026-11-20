import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { WritingFolder } from '../types/writing';
import { BottomSheetModal } from './BottomSheetModal';

interface FolderFormModalProps {
  open: boolean;
  editingFolder: WritingFolder | null;
  onClose: () => void;
  onSave: (name: string, description: string, folderId?: string) => void;
  onDelete?: (folderId: string) => void;
}

export const FolderFormModal: React.FC<FolderFormModalProps> = ({
  open,
  editingFolder,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editingFolder?.name ?? '');
      setDescription(editingFolder?.description ?? '');
      setConfirmDelete(false);
    }
  }, [open, editingFolder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, description.trim(), editingFolder?.id);
    onClose();
  };

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      title={editingFolder ? 'Edit Folder' : 'New Folder'}
      subtitle={
        editingFolder
          ? 'Rename this collection or update its note.'
          : 'Group related essays, chapters, or field notes.'
      }
    >
      {confirmDelete && editingFolder && onDelete ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[#E7DDD2]">
            Delete folder <strong className="text-[#F5EFE6]">{editingFolder.name}</strong>? Any drafts inside will remain safely in your library as Unfiled.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-white/15 bg-[#0B090A]/70 px-4 py-2.5 text-sm font-medium text-[#F5EFE6] hover:bg-[#2B0D17]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(editingFolder.id);
                onClose();
              }}
              className="flex-1 min-h-[44px] rounded-xl bg-[#7F1D1D] px-4 py-2.5 text-sm font-semibold text-[#FEE2E2] hover:bg-[#991B1B]"
            >
              Delete Folder
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folder-name-input" className="block text-xs font-medium text-[#B8A9A3]">
              Folder Name
            </label>
            <input
              id="folder-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Autumn Essays, Short Stories"
              maxLength={40}
              autoFocus
              className="mt-1.5 w-full min-h-[46px] rounded-xl border border-[#D4AF37]/25 bg-[#0B090A]/80 px-4 py-2.5 text-sm text-[#F5EFE6] placeholder-[#B8A9A3]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="folder-desc-input" className="block text-xs font-medium text-[#B8A9A3]">
              Note (optional)
            </label>
            <input
              id="folder-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief shelf description"
              maxLength={90}
              className="mt-1.5 w-full min-h-[46px] rounded-xl border border-white/10 bg-[#0B090A]/80 px-4 py-2.5 text-sm text-[#F5EFE6] placeholder-[#B8A9A3]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {editingFolder && onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete folder"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-red-900/40 bg-red-950/25 px-3 text-red-300 hover:bg-red-950/45"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-white/15 bg-[#0B090A]/60 px-4 py-2.5 text-sm font-medium text-[#E7DDD2] hover:bg-[#2B0D17]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 min-h-[44px] rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#0B090A] transition-colors hover:bg-[#E5C158] disabled:opacity-40"
            >
              {editingFolder ? 'Save Changes' : 'Create Folder'}
            </button>
          </div>
        </form>
      )}
    </BottomSheetModal>
  );
};
