import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Plus, ChevronLeft, MoreHorizontal, Trash2, X, Play, Pause } from 'lucide-react';
import { Screen, Album, Photo } from '../types';
import { useAuth } from '../AuthContext';
import { db, doc, onSnapshot, collection, query, where, orderBy, deleteDoc } from '../firebase';

interface Props {
  albumId: string | null;
  onNavigate: (screen: Screen, params?: { albumId?: string; photoId?: string }) => void;
}

export function AlbumScreen({ albumId, onNavigate }: Props) {
  const { user } = useAuth();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isSlideshowActive || isPaused || photos.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % photos.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isSlideshowActive, isPaused, photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSlideshowActive) {
        setIsSlideshowActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlideshowActive]);

  useEffect(() => {
    if (!albumId) {
      setLoading(false);
      return;
    }

    const unsubscribeAlbum = onSnapshot(doc(db, 'albums', albumId), (docSnap) => {
      if (docSnap.exists()) {
        setAlbum({ id: docSnap.id, ...docSnap.data() } as Album);
      }
    });

    const photosQuery = query(
      collection(db, 'photos'), 
      where('albumId', '==', albumId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribePhotos = onSnapshot(photosQuery, (snapshot) => {
      const photosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      setPhotos(photosData);
      setLoading(false);
    });

    return () => {
      unsubscribeAlbum();
      unsubscribePhotos();
    };
  }, [albumId]);

  const handleDeleteAlbum = async () => {
    if (!album || !user || album.ownerId !== user.uid) return;

    try {
      await deleteDoc(doc(db, 'albums', album.id));
      setIsDeleteModalOpen(false);
      onNavigate('dashboard');
    } catch (error) {
      console.error("Error deleting album", error);
      alert("Failed to delete album");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading album...</div>;
  }

  if (!album) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-muted mb-4">Album not found or please select an album from the dashboard.</p>
        <button 
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const isOwner = user?.uid === album.ownerId;

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="p-2 -ml-2 rounded-full hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 rounded-full hover:bg-border/50 text-red-500 hover:text-red-400 transition-colors">
              <Trash2 size={20} />
            </button>
          )}
          <button className="p-2 rounded-full hover:bg-border/50 text-text-muted hover:text-text-main transition-colors">
            <Share2 size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-border/50 text-text-muted hover:text-text-main transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Album Info */}
      <div className="mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-bold tracking-tight text-text-main mb-3"
        >
          {album.title}
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 text-text-muted font-medium"
        >
          <span>{album.date}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>{album.photoCount} photos</span>
        </motion.div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => onNavigate('upload', { albumId: album.id })}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Add Photos
        </button>
        
        {photos.length > 0 && (
          <button 
            onClick={() => {
              setCurrentSlideIndex(0);
              setIsSlideshowActive(true);
              setIsPaused(false);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-border text-text-main rounded-full font-bold hover:bg-background transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Play size={20} className="fill-current" />
            Play Slideshow
          </button>
        )}
      </div>

      {/* Photo Grid - Masonry Layout */}
      {photos.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-3xl border border-border shadow-sm">
          <p className="text-text-muted mb-4 font-medium">No photos in this album yet.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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

      {/* Full-Screen Slideshow Overlay */}
      <AnimatePresence>
        {isSlideshowActive && photos.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <button 
              onClick={() => setIsSlideshowActive(false)}
              className="absolute top-6 right-6 z-[110] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={24} />
            </button>

            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="absolute bottom-8 right-8 z-[110] p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            >
              {isPaused ? <Play size={24} className="fill-current" /> : <Pause size={24} className="fill-current" />}
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <img 
                  src={photos[currentSlideIndex].url}
                  alt={photos[currentSlideIndex].caption || "Slideshow image"}
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                {photos[currentSlideIndex].caption && (
                  <div className="absolute bottom-0 inset-x-0 p-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <p className="text-white text-xl md:text-3xl font-medium text-center drop-shadow-lg max-w-4xl mx-auto">
                      {photos[currentSlideIndex].caption}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-border"
          >
            <h3 className="text-2xl font-bold text-text-main mb-2">Delete Album</h3>
            <p className="text-text-muted mb-6">Are you sure you want to delete this album? This will not delete the photos inside it, but they will be orphaned.</p>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-full font-medium text-text-muted hover:bg-border/50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAlbum}
                className="px-6 py-2.5 rounded-full font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
