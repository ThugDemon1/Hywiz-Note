export interface Note {
  id: string;
  title: string;
  preview: string;
  date: string;
  thumbnail?: string;
  tags: string[];
  isPinned: boolean;
  category: string;
}

export interface Shortcut {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface RecentItem {
  id: string;
  title: string;
  type: 'webclip' | 'image' | 'document' | 'audio' | 'email';
  thumbnail?: string;
  timestamp: string;
}

export interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  badge?: number;
}