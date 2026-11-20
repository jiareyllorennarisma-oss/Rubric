export type PieceStatus = 'draft' | 'finished' | 'archived';

export type EditorFont = 'serif' | 'sans' | 'mono';

export type EditorFontSize = 'sm' | 'md' | 'lg';

export type EditorSurface = 'obsidian' | 'burgundy';

export type AppTab = 'home' | 'library' | 'vault';

export interface WritingFolder {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WritingPiece {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  status: PieceStatus;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  finishedAt?: number | null;
}

export interface WriterSettings {
  font: EditorFont;
  fontSize: EditorFontSize;
  surface: EditorSurface;
}
