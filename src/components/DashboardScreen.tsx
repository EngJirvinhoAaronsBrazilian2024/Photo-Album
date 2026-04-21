import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Plus, CalendarHeart, Trash2 } from 'lucide-react';
import { Screen, Album, Photo } from '../types';
import { useAuth } from '../AuthContext';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, where, updateDoc, increment, doc, deleteDoc } from '../firebase';

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
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const albumsQuery = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
    const unsubscribeAlbums = onSnapshot(albumsQuery, async (snapshot) => {
      const albumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
      
      // Auto-create initial albums if the database is entirely empty
      if (albumsData.length === 0 && !hasSeededRef.current) {
        hasSeededRef.current = true;
        const defaultNames = ["Aaron", "Edwin", "Phanice", "Dan", "Mercy", "Belinda"];
        try {
          const promises = defaultNames.map((name) => 
            addDoc(collection(db, 'albums'), {
              title: name,
              date: new Date().toLocaleDateString(),
              coverUrl: `https://picsum.photos/seed/${name.toLowerCase()}/600/600`, // Unique stable seed for each album
              photoCount: 0,
              ownerId: user.uid,
              createdAt: serverTimestamp()
            })
          );
          await Promise.all(promises);
          toast.success("Initial family albums created!");
        } catch (error) {
          console.error("Failed to seed baseline albums", error);
        }
      } else {
        setAlbums(albumsData);
      }
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
      toast.success('Album created successfully!');
    } catch (error) {
      console.error("Error creating album", error);
      toast.error("Failed to create album");
    }
  };

  const handleDeletePhoto = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.uid !== photo.authorId) {
      toast.error('You can only delete your own photos');
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      try {
        if (photo.albumId) {
          await updateDoc(doc(db, 'albums', photo.albumId), {
            photoCount: increment(-1)
          });
        }
        await deleteDoc(doc(db, 'photos', photo.id));
        toast.success("Photo deleted successfully");
      } catch (error) {
        console.error("Failed to delete photo:", error);
        toast.error("Failed to delete photo");
      }
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      <header className="mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-text-main mb-2"
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
                className="relative cursor-pointer group transition-all duration-500 hover:-translate-y-2 hover:z-10"
              >
                <div className="bg-white dark:bg-neutral-800 p-3 pb-12 shadow-sm hover:shadow-2xl border border-gray-200 dark:border-gray-700 relative flex flex-col h-full rounded-sm">
                  {/* Subtle photo mount tape detail */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm -rotate-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative aspect-square overflow-hidden bg-neutral-100 flex-none rounded-sm">
                    <img 
                      src={photo.url} 
                      alt={photo.caption || "Memory"} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {user?.uid === photo.authorId && (
                      <button
                        onClick={(e) => handleDeletePhoto(photo, e)}
                        className="absolute top-2 left-2 p-1.5 bg-black/40 hover:bg-red-500/90 backdrop-blur-md rounded-full text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none z-20"
                        title="Delete photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="inline-block px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                        {Math.floor(Math.random() * 5) + 1} YRS
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center p-2 mt-1">
                    <p className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-medium line-clamp-2 italic font-serif text-center break-words">
                      {photo.caption || "A cherished memory"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Albums Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-main">Family Albums</h2>
          {albums.length > 0 && <button className="text-primary font-bold hover:underline">View all</button>}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Create New Album Card */}
          <motion.button
            whileHover={{ scale: 0.98, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="aspect-[4/5] rounded-[2rem] border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-primary hover:bg-primary/10 hover:border-primary/50 transition-all shadow-sm hover:shadow-md mb-4"
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
              <div className="aspect-[4/5] mb-4 relative z-0">
                {/* Physical Photo Album Stack Effect */}
                <div className="absolute inset-0 bg-white dark:bg-neutral-800 border border-border rounded-[2rem] -rotate-3 scale-95 opacity-50 group-hover:-rotate-6 transition-transform duration-500 origin-bottom-left" />
                <div className="absolute inset-0 bg-white dark:bg-neutral-800 border border-border rounded-[2rem] rotate-2 scale-95 opacity-50 group-hover:rotate-4 transition-transform duration-500 origin-bottom-right" />
                
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-2xl transition-all duration-300 bg-surface border-[6px] border-white dark:border-neutral-800 z-10 flex flex-col">
                  {album.coverUrl && (
                    <img 
                      src={album.coverUrl} 
                      alt={album.title} 
                      className="flex-1 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {/* Album Spine binding detail */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/10 z-20 border-r border-white/20 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]" />
                  <div className="absolute left-2 top-4 bottom-4 w-px bg-white/30 z-20" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                </div>
              </div>
              <h3 className="font-bold text-text-main text-lg lg:text-xl truncate px-2">{album.title}</h3>
              <p className="text-sm text-text-muted font-medium px-2">{album.photoCount} photos</p>
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
            <p className="text-text-muted mb-4 font-medium">No photos yet.</p>
            <button 
              onClick={() => onNavigate('upload')}
              className="px-8 py-3 bg-primary text-white text-sm rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
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
                className="break-inside-avoid mb-6 cursor-pointer relative group transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:z-10"
              >
                {/* Polaroid/Physical Print Aesthetic */}
                <div className="bg-white dark:bg-neutral-800 p-2 pb-10 sm:p-3 sm:pb-12 md:p-4 md:pb-14 shadow-sm hover:shadow-2xl border border-gray-200 dark:border-gray-700 relative rounded-sm">
                  <div className="bg-neutral-100 mb-1 rounded-sm overflow-hidden relative">
                    <img 
                      src={photo.url} 
                      alt={photo.caption || "Photo"} 
                      className="w-full h-auto object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                    {user?.uid === photo.authorId && (
                      <button
                        onClick={(e) => handleDeletePhoto(photo, e)}
                        className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-red-500/90 backdrop-blur-md rounded-full text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none z-20"
                        title="Delete photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Subtle photo mount tape detail */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-5 sm:h-6 bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm rotate-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-12 md:h-14 flex items-center justify-center px-2">
                    <p className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-medium line-clamp-2 italic font-serif text-center break-words leading-tight">
                      {photo.caption || ""}
                    </p>
                  </div>
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
