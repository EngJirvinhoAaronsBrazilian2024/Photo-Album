import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Share2, Plus, ChevronLeft, MoreHorizontal, Trash2, X, Play, Pause, Facebook, Instagram, Link as LinkIcon, MessageCircle, Edit2 } from 'lucide-react';
import { Screen, Album, Photo } from '../types';
import { useAuth } from '../AuthContext';
import { db, doc, onSnapshot, collection, query, where, orderBy, deleteDoc, updateDoc, increment } from '../firebase';

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
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
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
      where('albumId', '==', albumId)
    );
    
    const unsubscribePhotos = onSnapshot(photosQuery, (snapshot) => {
      const photosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      
      // Sort client-side to avoid needing a composite Firebase Index (albumId + createdAt)
      photosData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setPhotos(photosData);
      setLoading(false);
    }, (error) => {
       console.error("Photos Fetch Error", error);
       toast.error("Failed to load photos from this album.");
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
      toast.success('Album deleted');
      onNavigate('dashboard');
    } catch (error) {
      console.error("Error deleting album", error);
      toast.error("Failed to delete album");
    }
  };

  const handleRenameAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album || !user || album.ownerId !== user.uid || !newAlbumTitle.trim()) return;

    try {
      await updateDoc(doc(db, 'albums', album.id), {
        title: newAlbumTitle.trim()
      });
      setIsRenameModalOpen(false);
      setNewAlbumTitle('');
      toast.success('Album renamed successfully');
    } catch (error) {
      console.error("Error renaming album", error);
      toast.error("Failed to rename album");
    }
  };

  const handleShare = async () => {
    if (!album) return;
    
    // Attempt native share first
    try {
      const shareUrl = `${window.location.origin}/?screen=album&albumId=${album.id}`;
      if (navigator.share && navigator.canShare && navigator.canShare({ url: shareUrl })) {
        await navigator.share({
          title: `Family Album: ${album.title}`,
          text: `Check out our album "${album.title}"!`,
          url: shareUrl
        });
        return;
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.log('Native share failed or unsupported, falling back...', e);
      } else {
        return;
      }
    }

    setIsShareMenuOpen(!isShareMenuOpen);
  };

  const shareToWhatsApp = () => {
    const shareUrl = `${window.location.origin}/?screen=album&albumId=${album?.id}`;
    const text = `Check out our album "${album?.title}"! ${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setIsShareMenuOpen(false);
  };

  const shareToFacebook = () => {
    const shareUrl = `${window.location.origin}/?screen=album&albumId=${album?.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    setIsShareMenuOpen(false);
  };

  const shareCopiedLink = () => {
    const shareUrl = `${window.location.origin}/?screen=album&albumId=${album?.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
    setIsShareMenuOpen(false);
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
        <div className="flex items-center gap-2 relative">
          {isOwner && (
            <>
              <button 
                onClick={() => {
                  setNewAlbumTitle(album.title);
                  setIsRenameModalOpen(true);
                }} 
                className="p-2 rounded-full hover:bg-border/50 text-text-muted hover:text-text-main transition-colors"
                title="Rename album"
              >
                <Edit2 size={20} />
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(true)} 
                className="p-2 rounded-full hover:bg-border/50 text-red-500 hover:text-red-400 transition-colors"
                title="Delete album"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
          
          <div className="relative">
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-border/50 text-text-muted hover:text-text-main transition-colors">
              <Share2 size={20} />
            </button>
            
            {isShareMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-30 overflow-hidden flex flex-col">
                <button onClick={shareToWhatsApp} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-border/50 transition-colors text-left">
                  <MessageCircle size={16} className="text-green-500" />
                  WhatsApp
                </button>
                <button onClick={shareToFacebook} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-border/50 transition-colors text-left border-t border-border/50">
                  <Facebook size={16} className="text-blue-500" />
                  Facebook
                </button>
                <button onClick={() => {
                  toast.success("To share to Instagram, tap the Share icon on your phone!");
                  setIsShareMenuOpen(false);
                }} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-border/50 transition-colors text-left border-t border-border/50">
                  <Instagram size={16} className="text-pink-500" />
                  Instagram
                </button>
                <button onClick={shareCopiedLink} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-border/50 transition-colors text-left border-t border-border/50 bg-primary/5">
                  <LinkIcon size={16} className="text-text-main" />
                  Copy Link
                </button>
              </div>
            )}
          </div>

          <button className="p-2 rounded-full hover:bg-border/50 text-text-muted hover:text-text-main transition-colors hidden">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Album Info */}
      <div className="mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-text-main mb-3"
        >
          {album.title}
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 text-text-muted text-sm font-medium"
        >
          <span>{album.date}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>{album.photoCount} photos</span>
        </motion.div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <button 
          onClick={() => onNavigate('upload', { albumId: album.id })}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
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
            className="flex items-center gap-2 px-6 py-3 bg-surface border-2 border-border text-sm text-text-main rounded-full font-bold hover:bg-background transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
              className="break-inside-avoid mb-6 cursor-pointer relative group transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:z-10"
            >
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-5 sm:h-6 bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm rotate-[3deg] z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                
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

      {/* Rename Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-border"
          >
            <h3 className="text-2xl font-bold text-text-main mb-2">Rename Album</h3>
            <form onSubmit={handleRenameAlbum}>
              <input 
                type="text" 
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                placeholder="Album Name"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors mb-6 mt-4"
                autoFocus
              />
              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-5 py-2.5 rounded-full font-medium text-text-muted hover:bg-border/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newAlbumTitle.trim() || newAlbumTitle.trim() === album?.title}
                  className="px-6 py-2.5 rounded-full font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
