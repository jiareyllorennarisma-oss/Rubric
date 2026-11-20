import { WritingPiece } from '../types/writing';

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function estimateReadingMinutes(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getExcerpt(content: string, maxLength = 135): string {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Blank page ready for your first line.';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trimEnd()}…`;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late night quiet';
  if (hour < 12) return 'Morning pages';
  if (hour < 17) return 'Afternoon desk';
  if (hour < 21) return 'Evening study';
  return 'Nightfall desk';
}

export function downloadPiece(piece: WritingPiece, format: 'md' | 'txt'): void {
  const title = piece.title.trim() || 'Untitled Manuscript';
  const safeName = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'manuscript';

  const body =
    format === 'md'
      ? `# ${title}\n\n${piece.content}`
      : `${title}\n${'='.repeat(Math.min(title.length, 48))}\n\n${piece.content}`;

  const blob = new Blob([body], {
    type: format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeName}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
