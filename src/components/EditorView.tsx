import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Folder,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  EditorFont,
  EditorFontSize,
  EditorSurface,
  WriterSettings,
  WritingFolder,
  WritingPiece,
} from '../types/writing';
import {
  countCharacters,
  countWords,
  downloadPiece,
  estimateReadingMinutes,
} from '../utils/metrics';
import { BottomSheetModal } from './BottomSheetModal';

interface EditorViewProps {
  piece: WritingPiece;
  folders: WritingFolder[];
  settings: WriterSettings;
  onUpdatePiece: (updated: WritingPiece) => Promise<void>;
  onUpdateSettings: (settings: WriterSettings) => void;
  onBack: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  piece,
  folders,
  settings,
  onUpdatePiece,
  onUpdateSettings,
  onBack,
}) => {
  const [title, setTitle] = useState(piece.title);
  const [content, setContent] = useState(piece.content);
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [zenMode, setZenMode] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const latestPieceRef = useRef<WritingPiece>(piece);
  const saveTimerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  // Sync if user switches to a different piece ID
  useEffect(() => {
    setTitle(piece.title);
    setContent(piece.content);
    latestPieceRef.current = piece;
    dirtyRef.current = false;
    setSaveState('saved');
  }, [piece.id]);

  // Keep latestPieceRef updated with external metadata changes (folder/status)
  useEffect(() => {
    latestPieceRef.current = {
      ...piece,
      title,
      content,
    };
  }, [piece.folderId, piece.status, piece.pinned, piece.finishedAt]);

  // Auto-resize textareas cleanly
  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resizeTextarea(titleRef.current);
  }, [title]);

  useEffect(() => {
    resizeTextarea(bodyRef.current);
  }, [content, settings.font, settings.fontSize]);

  const flushSave = async (nextTitle: string, nextContent: string) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const updated: WritingPiece = {
      ...latestPieceRef.current,
      title: nextTitle,
      content: nextContent,
      updatedAt: Date.now(),
    };
    latestPieceRef.current = updated;
    dirtyRef.current = false;
    await onUpdatePiece(updated);
    setSaveState('saved');
  };

  const scheduleSave = (nextTitle: string, nextContent: string) => {
    dirtyRef.current = true;
    setSaveState('saving');
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void flushSave(nextTitle, nextContent);
    }, 380);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (dirtyRef.current) {
        const finalPiece: WritingPiece = {
          ...latestPieceRef.current,
          updatedAt: Date.now(),
        };
        void onUpdatePiece(finalPiece);
      }
    };
  }, []);

  useEffect(() => {
    if (!zenMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    latestPieceRef.current = { ...latestPieceRef.current, title: val };
    scheduleSave(val, content);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    latestPieceRef.current = { ...latestPieceRef.current, content: val };
    scheduleSave(title, val);
  };

  const handleBack = async () => {
    if (dirtyRef.current) {
      await flushSave(title, content);
    }
    onBack();
  };

  const handleFolderChange = async (folderId: string | null) => {
    const updated: WritingPiece = {
      ...latestPieceRef.current,
      title,
      content,
      folderId,
      updatedAt: Date.now(),
    };
    latestPieceRef.current = updated;
    await onUpdatePiece(updated);
    setShowFolderPicker(false);
  };

  const handleStatusChange = async (status: WritingPiece['status']) => {
    const now = Date.now();
    const updated: WritingPiece = {
      ...latestPieceRef.current,
      title,
      content,
      status,
      updatedAt: now,
      finishedAt: status === 'finished' ? now : null,
    };
    latestPieceRef.current = updated;
    await onUpdatePiece(updated);
    setShowOptions(false);
  };

  const handleCopyText = async () => {
    try {
      const fullText = `${title.trim() ? title.trim() + '\n\n' : ''}${content}`;
      await navigator.clipboard.writeText(fullText);
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 1800);
    } catch {
      // Clipboard fallback silently ignored
    }
  };

  const words = countWords(content);
  const chars = countCharacters(content);
  const readMins = estimateReadingMinutes(words);

  const currentFolderName =
    folders.find((f) => f.id === piece.folderId)?.name ?? 'Unfiled';

  const surfaceBg =
    settings.surface === 'burgundy'
      ? 'bg-gradient-to-b from-[#1A090F] via-[#13070B] to-[#0B090A]'
      : 'bg-[#0B090A]';

  const bodyFontClass =
    settings.font === 'serif'
      ? 'font-editorial tracking-[0.005em]'
      : settings.font === 'mono'
      ? 'font-mono-num'
      : 'font-sans-ui tracking-[0.01em]';

  const bodySizeClass =
    settings.fontSize === 'sm'
      ? settings.font === 'serif'
        ? 'text-[18px] leading-[1.75]'
        : 'text-[15px] leading-[1.75]'
      : settings.fontSize === 'lg'
      ? settings.font === 'serif'
        ? 'text-[23px] leading-[1.8]'
        : 'text-[19px] leading-[1.8]'
      : settings.font === 'serif'
      ? 'text-[20px] leading-[1.78]'
      : 'text-[16.5px] leading-[1.78]';

  return (
    <div className={`min-h-screen flex flex-col ${surfaceBg} transition-colors duration-300`}>
      {/* Top Editor Chrome — Completely Hidden in Zen Mode */}
      {!zenMode ? (
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B090A]/90 backdrop-blur-md pt-safe">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-2 px-3 sm:px-6">
            <div className="flex items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back to workspace"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#E7DDD2] transition-colors hover:bg-[#2B0D17] hover:text-[#E5C158]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowFolderPicker(true)}
                className="inline-flex min-h-[40px] max-w-[115px] sm:max-w-[220px] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#B8A9A3] transition-colors hover:bg-[#1B090F] hover:text-[#E5C158]"
              >
                <Folder className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                <span className="truncate">{currentFolderName}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Auto-Save Status */}
              <div
                aria-live="polite"
                className="flex items-center gap-1.5 px-2 text-xs text-[#B8A9A3] whitespace-nowrap"
              >
                {saveState === 'saving' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D4AF37]" aria-hidden="true" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>Saved</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setZenMode(true)}
                aria-label="Enter Zen Mode"
                title="Zen Mode (hide all distractions)"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-[#B8A9A3] transition-colors hover:bg-[#2B0D17] hover:text-[#E5C158] whitespace-nowrap shrink-0"
              >
                <Maximize2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Zen</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOptions(true)}
                aria-label="Typography, vault, and export options"
                title="Manuscript options"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#B8A9A3] transition-colors hover:bg-[#2B0D17] hover:text-[#E5C158]"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
      ) : (
        <div className="fixed right-3 top-3 z-30 pt-safe">
          <button
            type="button"
            onClick={() => setZenMode(false)}
            aria-label="Exit Zen Mode"
            title="Exit Zen Mode (Esc)"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#D4AF37]/20 bg-[#1B090F]/55 px-3 py-2 text-xs font-medium text-[#E5C158] opacity-40 backdrop-blur-md transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 whitespace-nowrap"
          >
            <Minimize2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Exit Zen</span>
          </button>
        </div>
      )}

      {/* Uninterrupted Writing Canvas */}
      <main className="flex-1">
        <div
          className={`mx-auto w-full max-w-[68ch] px-5 sm:px-8 ${
            zenMode ? 'pt-14 sm:pt-20 pb-20' : 'pt-8 sm:pt-12 pb-32'
          } transition-[padding] duration-200`}
        >
          {piece.status !== 'draft' && !zenMode && (
            <div className="mb-4 text-xs text-[#D4AF37]">
              {piece.status === 'finished'
                ? 'Stored in Vault as Finished'
                : 'Stored in Vault as In-Progress'}
            </div>
          )}

          <textarea
            ref={titleRef}
            rows={1}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled piece"
            aria-label="Manuscript title"
            className="w-full resize-none overflow-hidden bg-transparent font-editorial text-3xl sm:text-4xl font-semibold leading-tight text-[#F5EFE6] placeholder-[#9C8D87]/45 focus:outline-none"
          />

          <div className="my-5 h-px w-12 bg-[#D4AF37]/35" />

          <textarea
            ref={bodyRef}
            rows={14}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Begin writing freely…"
            aria-label="Manuscript prose"
            autoFocus={!piece.content}
            className={`w-full min-h-[58vh] resize-none overflow-hidden bg-transparent text-[#EFE7DB] placeholder-[#9C8D87]/40 focus:outline-none ${bodyFontClass} ${bodySizeClass}`}
          />
        </div>
      </main>

      {/* Whisper-Quiet Bottom Metrics Bar — Completely Hidden in Zen Mode */}
      {!zenMode && (
        <footer className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#0B090A] via-[#0B090A]/85 to-transparent pb-safe">
          <div className="mx-auto flex h-11 max-w-4xl items-center justify-between px-5 sm:px-8 text-xs text-[#9C8D87]">
            <div className="font-mono-num">
              {words.toLocaleString()} {words === 1 ? 'word' : 'words'}
              <span aria-hidden="true"> · </span>
              <span>{chars.toLocaleString()} chars</span>
              {words > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{readMins} min read</span>
                </>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Quick Folder Picker Sheet */}
      <BottomSheetModal
        open={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        title="Assign Folder"
        subtitle="Organize where this manuscript lives in your library."
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleFolderChange(null)}
            className={`flex w-full min-h-[46px] items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
              piece.folderId === null
                ? 'border-[#D4AF37]/50 bg-[#3B1220] text-[#E5C158]'
                : 'border-white/10 bg-[#0B090A]/60 text-[#F5EFE6] hover:bg-[#2B0D17]'
            }`}
          >
            <span>Unfiled Desk</span>
            {piece.folderId === null && <span className="text-xs text-[#D4AF37]">Selected</span>}
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => handleFolderChange(folder.id)}
              className={`flex w-full min-h-[46px] items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                piece.folderId === folder.id
                  ? 'border-[#D4AF37]/50 bg-[#3B1220] text-[#E5C158]'
                  : 'border-white/10 bg-[#0B090A]/60 text-[#F5EFE6] hover:bg-[#2B0D17]'
              }`}
            >
              <span className="truncate">{folder.name}</span>
              {piece.folderId === folder.id && (
                <span className="text-xs text-[#D4AF37]">Selected</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheetModal>

      {/* Typography, Surface, Vault & Export Sheet */}
      <BottomSheetModal
        open={showOptions}
        onClose={() => setShowOptions(false)}
        title="Page & Manuscript"
        subtitle="Customize your writing surface, store to vault, or export locally."
      >
        <div className="space-y-6">
          {/* Font Family */}
          <div>
            <span className="block text-xs font-medium text-[#B8A9A3]">
              Typeface
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ['serif', 'Editorial Serif'],
                  ['sans', 'Clean Sans'],
                  ['mono', 'Typewriter'],
                ] as [EditorFont, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, font: key })}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    settings.font === key
                      ? 'border-[#D4AF37] bg-[#3B1220] text-[#E5C158]'
                      : 'border-white/10 bg-[#0B090A]/60 text-[#E7DDD2] hover:bg-[#2B0D17]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Surface */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-[#B8A9A3]">
                Text Scale
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ['sm', 'Small'],
                    ['md', 'Medium'],
                    ['lg', 'Large'],
                  ] as [EditorFontSize, string][]
                ).map(([sizeKey, label]) => (
                  <button
                    key={sizeKey}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, fontSize: sizeKey })
                    }
                    className={`min-h-[44px] rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                      settings.fontSize === sizeKey
                        ? 'border-[#D4AF37] bg-[#3B1220] text-[#E5C158]'
                        : 'border-white/10 bg-[#0B090A]/60 text-[#E7DDD2] hover:bg-[#2B0D17]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#B8A9A3]">
                Paper Tone
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ['obsidian', 'Matte Black'],
                    ['burgundy', 'Deep Maroon'],
                  ] as [EditorSurface, string][]
                ).map(([surfaceKey, label]) => (
                  <button
                    key={surfaceKey}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, surface: surfaceKey })
                    }
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                      settings.surface === surfaceKey
                        ? 'border-[#D4AF37] bg-[#3B1220] text-[#E5C158]'
                        : 'border-white/10 bg-[#0B090A]/60 text-[#E7DDD2] hover:bg-[#2B0D17]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vault Storage Actions */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="block text-xs font-medium text-[#B8A9A3]">
              Vault &amp; Status
            </span>
            {piece.status === 'draft' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('finished')}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/35 bg-[#2B0D17] px-3 py-2.5 text-xs font-medium text-[#E5C158] hover:bg-[#3B1220]"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Mark Finished (Vault)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('archived')}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0B090A]/60 px-3 py-2.5 text-xs font-medium text-[#E7DDD2] hover:bg-[#2B0D17]"
                >
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  <span>Archive In-Progress</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange('draft')}
                className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/35 bg-[#2B0D17] px-4 py-2.5 text-xs font-medium text-[#E5C158] hover:bg-[#3B1220]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Restore to Active Drafts</span>
              </button>
            )}
          </div>

          {/* Local File Export */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="block text-xs font-medium text-[#B8A9A3]">
              Export Copy
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadPiece({ ...piece, title, content }, 'md')
                }
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#0B090A]/60 px-2.5 py-2 text-xs font-medium text-[#E7DDD2] hover:bg-[#2B0D17]"
              >
                <Download className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                <span>.md</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadPiece({ ...piece, title, content }, 'txt')
                }
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#0B090A]/60 px-2.5 py-2 text-xs font-medium text-[#E7DDD2] hover:bg-[#2B0D17]"
              >
                <FileText className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                <span>.txt</span>
              </button>
              <button
                type="button"
                onClick={handleCopyText}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#0B090A]/60 px-2.5 py-2 text-xs font-medium text-[#E7DDD2] hover:bg-[#2B0D17]"
              >
                <Copy className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                <span>{copiedNotice ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </BottomSheetModal>
    </div>
  );
};
