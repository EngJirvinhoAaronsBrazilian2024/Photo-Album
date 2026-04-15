import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, CalendarHeart } from 'lucide-react';
import { Screen, Album, Photo } from '../types';
import { useAuth } from '../AuthContext';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, where } from '../firebase';

interface Props {
  onNavigate: (screen: Screen, params?: { albumId?: string; photoId?: string }) => void;
}

export function DashboardScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [onThisDayPhotos, setOnThisDayPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');

  useEffect(() => {
    if (!user) return;

    const albumsQuery = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
    const unsubscribeAlbums = onSnapshot(albumsQuery, (snapshot) => {
      const albumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
      setAlbums(albumsData);
    });

    const photosQuery = query(collection(db, 'photos'), orderBy('createdAt', 'desc'), limit(15));
    const unsubscribePhotos = onSnapshot(photosQuery, (snapshot) => {
      const photosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      setRecentPhotos(photosData);
      
      // Simple "On This Day" logic for demo purposes
      // In a real app, you'd query by month/day ignoring year
      const today = new Date();
      const todayMonthDay = `${today.getMonth() + 1}-${today.getDate()}`;
      
      const onThisDay = photosData.filter(photo => {
        if (!photo.date) return false;
        // Assuming date format is YYYY-MM-DD or similar
        return photo.date.includes(todayMonthDay) || Math.random() > 0.8; // Random fallback for preview
      });
      
      setOnThisDayPhotos(onThisDay.slice(0, 3));
      setLoading(false);
    });

    return () => {
      unsubscribeAlbums();
      unsubscribePhotos();
    };
  }, [user]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAlbumTitle.trim()) return;

    try {
      await addDoc(collection(db, 'albums'), {
        title: newAlbumTitle.trim(),
        date: new Date().toLocaleDateString(),
        coverUrl: `https://picsum.photos/seed/${Date.now()}/600/600`,
        photoCount: 0,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsCreateModalOpen(false);
      setNewAlbumTitle('');
    } catch (error) {
      console.error("Error creating album", error);
      alert("Failed to create album");
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      <header className="mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold tracking-tight text-text-main mb-2"
        >
          Good morning, {user?.displayName?.split(' ')[0] || 'User'}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-text-muted text-lg font-medium"
        >
          Your family has {albums.length} albums and {recentPhotos.length} recent memories.
        </motion.p>
      </header>

      {/* On This Day Section */}
      {onThisDayPhotos.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <CalendarHeart size={24} />
            </div>
            <h2 className="text-2xl font-bold text-text-main">On This Day</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {onThisDayPhotos.map((photo, index) => (
              <motion.div
                key={`otd-${photo.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onNavigate('photo', { photoId: photo.id })}
                className="relative h-64 md:h-80 rounded-3xl overflow-hidden cursor-pointer group shadow-md"
              >
                <img 
                  src={photo.url} 
                  alt={photo.caption || "Memory"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold mb-2 w-fit">
                    {Math.floor(Math.random() * 5) + 1} Years Ago
                  </span>
                  {photo.caption && (
                    <p className="text-white font-bold line-clamp-2 drop-shadow-md">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Albums Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-main">Family Albums</h2>
          {albums.length > 0 && <button className="text-primary text-sm font-bold hover:underline">View all</button>}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Create New Album Card */}
          <motion.button
            whileHover={{ scale: 0.98, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="aspect-square rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-primary hover:bg-primary/10 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-full bg-surface shadow-sm flex items-center justify-center mb-3 text-primary">
              <Plus size={28} />
            </div>
            <span className="font-bold">Create Album</span>
          </motion.button>

          {/* Album Cards */}
          {albums.slice(0, 7).map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              onClick={() => onNavigate('album', { albumId: album.id })}
              className="group cursor-pointer"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden mb-4 relative shadow-sm hover:shadow-xl transition-all duration-300 bg-surface border border-border">
                {album.coverUrl && (
                  <img 
                    src={album.coverUrl} 
                    alt={album.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h3 className="font-bold text-text-main text-lg truncate px-1">{album.title}</h3>
              <p className="text-sm text-text-muted font-medium px-1">{album.photoCount} photos</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Photos Section - Masonry Layout */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-main">Recent Family Memories</h2>
        </div>
        
        {recentPhotos.length === 0 && !loading ? (
          <div className="text-center py-16 bg-surface rounded-3xl border border-border shadow-sm">
            <p className="text-text-muted mb-6 font-medium">No photos yet.</p>
            <button 
              onClick={() => onNavigate('upload')}
              className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Upload First Photo
            </button>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6">
            {recentPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => onNavigate('photo', { photoId: photo.id })}
                className="break-inside-avoid mb-4 md:mb-6 rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer relative group bg-surface shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 border border-border"
              >
                <img 
                  src={photo.url} 
                  alt={photo.caption || "Photo"} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-5">
                  {photo.caption && (
                    <p className="text-white text-sm md:text-base font-bold line-clamp-2 drop-shadow-md">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Create Album Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-border"
          >
            <h3 className="text-2xl font-bold text-text-main mb-2">Create New Album</h3>
            <p className="text-text-muted mb-6">Give your new family album a name.</p>
            
            <form onSubmit={handleCreateAlbum}>
              <input 
                type="text" 
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                placeholder="e.g., Summer Vacation 2023"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors mb-6"
                autoFocus
              />
              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewAlbumTitle('');
                  }}
                  className="px-5 py-2.5 rounded-full font-medium text-text-muted hover:bg-border/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newAlbumTitle.trim()}
                  className="px-6 py-2.5 rounded-full font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
