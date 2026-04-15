import { Album, Photo } from './types';

export const mockPhotos: Photo[] = [
  {
    id: 'p1',
    url: 'https://picsum.photos/seed/family1/800/1000',
    caption: 'Summer vacation at the lake house',
    date: 'Aug 15, 2023',
    likes: 12,
    comments: 3,
    author: {
      name: 'Sarah Jenkins',
      avatarUrl: 'https://picsum.photos/seed/user/100/100'
    }
  },
  {
    id: 'p2',
    url: 'https://picsum.photos/seed/family2/800/800',
    caption: 'Grandpa\'s 80th birthday party',
    date: 'Oct 2, 2023',
    likes: 24,
    comments: 8,
    author: {
      name: 'Uncle Bob',
      avatarUrl: 'https://picsum.photos/seed/user2/100/100'
    }
  },
  {
    id: 'p3',
    url: 'https://picsum.photos/seed/family3/1000/800',
    caption: 'First day of school',
    date: 'Sep 5, 2023',
    likes: 18,
    comments: 5,
    author: {
      name: 'Sarah Jenkins',
      avatarUrl: 'https://picsum.photos/seed/user/100/100'
    }
  },
  {
    id: 'p4',
    url: 'https://picsum.photos/seed/family4/800/1200',
    caption: 'Hiking in the mountains',
    date: 'Jul 22, 2023',
    likes: 31,
    comments: 2,
    author: {
      name: 'Aunt Mary',
      avatarUrl: 'https://picsum.photos/seed/user3/100/100'
    }
  },
  {
    id: 'p5',
    url: 'https://picsum.photos/seed/family5/800/800',
    caption: 'Christmas morning',
    date: 'Dec 25, 2023',
    likes: 45,
    comments: 12,
    author: {
      name: 'Grandma Rose',
      avatarUrl: 'https://picsum.photos/seed/user4/100/100'
    }
  },
  {
    id: 'p6',
    url: 'https://picsum.photos/seed/family6/1200/800',
    caption: 'Beach day with the cousins',
    date: 'Jun 10, 2023',
    likes: 27,
    comments: 4,
    author: {
      name: 'Uncle Bob',
      avatarUrl: 'https://picsum.photos/seed/user2/100/100'
    }
  }
];

export const mockAlbums: Album[] = [
  {
    id: 'a1',
    title: 'Summer 2023',
    date: 'Jun - Aug 2023',
    coverUrl: 'https://picsum.photos/seed/family1/600/600',
    photoCount: 142,
    photos: mockPhotos,
  },
  {
    id: 'a2',
    title: 'Holidays',
    date: 'Dec 2023',
    coverUrl: 'https://picsum.photos/seed/family5/600/600',
    photoCount: 56,
    photos: mockPhotos.slice(4),
  },
  {
    id: 'a3',
    title: 'Birthdays',
    date: '2023',
    coverUrl: 'https://picsum.photos/seed/family2/600/600',
    photoCount: 28,
    photos: mockPhotos.slice(1, 3),
  },
  {
    id: 'a4',
    title: 'School Events',
    date: '2023 - 2024',
    coverUrl: 'https://picsum.photos/seed/family3/600/600',
    photoCount: 45,
    photos: [mockPhotos[2]],
  }
];
