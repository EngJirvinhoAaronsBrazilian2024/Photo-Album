export type Screen = 'login' | 'dashboard' | 'album' | 'upload' | 'photo' | 'profile' | 'timeline' | 'notifications';

export interface Author {
  name: string;
  avatarUrl: string;
}

export interface Photo {
  id: string;
  albumId?: string;
  url: string;
  caption: string;
  date: string;
  timestamp?: number;
  likes: number;
  comments: number;
  author?: Author;
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  audioUrl?: string;
  reactions?: Record<string, string[]>;
  taggedUsers?: string[];
  createdAt?: any;
}

export interface Album {
  id: string;
  title: string;
  date: string;
  coverUrl: string;
  photoCount: number;
  photos: Photo[];
  ownerId?: string;
  permissions?: 'collaborative' | 'view_only';
  createdAt?: any;
}

export interface Comment {
  id: string;
  photoId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_album' | 'new_comment' | 'new_photo' | 'tag';
  message: string;
  read: boolean;
  linkTo?: { screen: Screen, params?: any };
  createdAt: any;
}

