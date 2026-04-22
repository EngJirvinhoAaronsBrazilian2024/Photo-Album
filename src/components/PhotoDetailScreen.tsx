import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, Heart, MessageCircle, Share2, MoreHorizontal, Download, ChevronRight, Trash2, Facebook, Instagram, Link as LinkIcon, Copy } from 'lucide-react';
import { Screen, Photo, Comment } from '../types';
import { useAuth } from '../AuthContext';
import { db, doc, onSnapshot, collection, query, where, orderBy, addDoc, updateDoc, increment, serverTimestamp, deleteDoc, storage, ref } from '../firebase';
import { deleteObject } from 'firebase/storage';

interface Props {
  photoId: string | null;
  onNavigate: (screen: Screen, params?: { albumId?: string; photoId?: string }) => void;
}

export function PhotoDetailScreen({ photoId, onNavigate }: Props) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const isLiked = photo?.reactions?.['heart']?.includes(user?.uid || '') || false;

  useEffect(() => {
    if (!photoId) {
      setLoading(false);
      return;
    }

    const unsubscribePhoto = onSnapshot(doc(db, 'photos', photoId), (docSnap) => {
      if (docSnap.exists()) {
        const photoData = { id: docSnap.id, ...docSnap.data() } as Photo;
        setPhoto(photoData);
        
        // Fetch all photos in the same album for navigation
        if (photoData.albumId) {
          const albumPhotosQuery = query(
            collection(db, 'photos'),
            where('albumId', '==', photoData.albumId),
            orderBy('createdAt', 'desc')
          );
          onSnapshot(albumPhotosQuery, (snapshot) => {
            setAlbumPhotos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Photo)));
          });
        }
      }
    });

    const commentsQuery = query(
      collection(db, 'comments'),
      where('photoId', '==', photoId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(commentsData);
      setLoading(false);
    });

    return () => {
      unsubscribePhoto();
      unsubscribeComments();
    };
  }, [photoId]);

  const handleLike = async () => {
    if (!photo || !photoId || !user) return;
    
    const hasLiked = photo.reactions?.['heart']?.includes(user.uid) || false;
    const newReactions = { ...(photo.reactions || {}) };
    const heartUsers = newReactions['heart'] || [];
    
    if (hasLiked) {
      newReactions['heart'] = heartUsers.filter(id => id !== user.uid);
    } else {
      newReactions['heart'] = [...heartUsers, user.uid];
    }
    
    if (newReactions['heart'].length === 0) {
      delete newReactions['heart'];
    }

    try {
      await updateDoc(doc(db, 'photos', photoId), {
        reactions: newReactions,
        likes: increment(hasLiked ? -1 : 1)
      });
    } catch (error) {
      console.error("Error updating likes", error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!photo || !photoId || !user) return;
    
    const currentReactions = photo.reactions || {};
    const usersWhoReacted = currentReactions[emoji] || [];
    const hasReacted = usersWhoReacted.includes(user.uid);
    
    let newUsersWhoReacted;
    if (hasReacted) {
      newUsersWhoReacted = usersWhoReacted.filter(id => id !== user.uid);
    } else {
      newUsersWhoReacted = [...usersWhoReacted, user.uid];
    }
    
    const newReactions = { ...currentReactions };
    if (newUsersWhoReacted.length === 0) {
      delete newReactions[emoji];
    } else {
      newReactions[emoji] = newUsersWhoReacted;
    }

    try {
      await updateDoc(doc(db, 'photos', photoId), {
        reactions: newReactions
      });
    } catch (error) {
      console.error("Error updating reactions", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !photoId) return;

    const commentText = newComment;
    setNewComment('');

    try {
      await addDoc(collection(db, 'comments'), {
        photoId,
        text: commentText,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous User',
        authorAvatarUrl: user.photoURL || '',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'photos', photoId), {
        comments: increment(1)
      });
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment", error);
      toast.error("Failed to add comment");
    }
  };

  const handleDownload = async () => {
    if (!photo) return;
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `family-photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download image', error);
      // Fallback for CORS issues
      window.open(photo.url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!photo || !photoId || !user || photo.authorId !== user.uid) return;

    try {
      // Update album photo count
      if (photo.albumId) {
        await updateDoc(doc(db, 'albums', photo.albumId), {
          photoCount: increment(-1)
        });
      }
      
      // Delete photo document
      await deleteDoc(doc(db, 'photos', photoId));

      // Attempt to delete from Storage if it's a Firebase Storage URL
      if (photo.url.includes('firebasestorage.googleapis.com')) {
        try {
          const fileRef = ref(storage, photo.url);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error("Error deleting file from storage", storageError);
          // We don't block the UI if storage deletion fails, as the document is already gone
        }
      }
      
      setIsDeleteModalOpen(false);
      toast.success("Photo deleted");
      // Navigate back to album
      onNavigate('album', { albumId: photo.albumId });
    } catch (error) {
      console.error("Error deleting photo", error);
      toast.error("Failed to delete photo");
    }
  };

  const handleShare = async () => {
    if (!photo) return;
    
    // Attempt native share first (NATIVE SUPPORT FOR INSTAGRAM/FB/WA Mobile Apps)
    try {
      const shareUrl = `${window.location.origin}/?screen=photo&photoId=${photoId}&albumId=${photo.albumId}`;
      if (navigator.share && navigator.canShare) {
        // We fetch the image to share it natively
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const file = new File([blob], `family-photo-${photo.id}.jpg`, { type: blob.type || 'image/jpeg' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Family Album Memory',
            text: photo.caption || 'Look at this memory!',
            files: [file]
          });
          return;
        } else if (navigator.canShare({ url: shareUrl })) {
          await navigator.share({
            title: 'Family Album',
            text: photo.caption || 'Look at this memory!',
            url: shareUrl
          });
          return;
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
         console.log('Native share failed or unsupported, falling back...', e);
      } else {
        return; // User cancelled the native share
      }
    }

    // Fallback to custom menu
    setIsShareMenuOpen(!isShareMenuOpen);
  };

  const shareToWhatsApp = () => {
    const shareUrl = `${window.location.origin}/?screen=photo&photoId=${photoId}&albumId=${photo?.albumId}`;
    const text = `Look at this memory on our Family Album! ${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setIsShareMenuOpen(false);
  };

  const shareToFacebook = () => {
    const shareUrl = `${window.location.origin}/?screen=photo&photoId=${photoId}&albumId=${photo?.albumId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    setIsShareMenuOpen(false);
  };

  const shareCopiedLink = () => {
    const shareUrl = `${window.location.origin}/?screen=photo&photoId=${photoId}&albumId=${photo?.albumId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
    setIsShareMenuOpen(false);
  };

  const copyImageToClipboard = async () => {
    if (!photo) return;
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      
      // We must explicitly create a strict mime-type blob for clipboard
      const imageBlob = new Blob([blob], { type: 'image/jpeg' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/jpeg': imageBlob })
      ]);
      
      toast.success("Photo copied! You can now paste it directly into WhatsApp, Facebook, or iMessage.", { duration: 4000 });
      setIsShareMenuOpen(false);
    } catch (error) {
      console.error("Clipboard copy failed", error);
      toast.error("Failed to copy photo. Try downloading it instead.");
    }
  };

  const currentIndex = albumPhotos.findIndex(p => p.id === photoId);
  const hasNext = currentIndex > 0;
  const hasPrev = currentIndex < albumPhotos.length - 1;

  const navigateToNext = () => {
    if (hasNext) {
      onNavigate('photo', { photoId: albumPhotos[currentIndex - 1].id });
    }
  };

  const navigateToPrev = () => {
    if (hasPrev) {
      onNavigate('photo', { photoId: albumPhotos[currentIndex + 1].id });
    }
  };

  if (loading) {
    return <div className="fixed inset-0 bg-black z-50 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!photo) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
        <p className="mb-4">Photo not found.</p>
        <button onClick={() => onNavigate('dashboard')} className="px-4 py-2 bg-primary rounded-full">Go Back</button>
      </div>
    );
  }

  const isOwner = user?.uid === photo.authorId;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent md:hidden">
        <button 
          onClick={() => onNavigate('album', { albumId: photo.albumId })}
          className="p-2 rounded-full bg-black/20 text-white backdrop-blur-md"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 rounded-full bg-black/20 text-red-500 hover:text-red-400 backdrop-blur-md transition-colors">
              <Trash2 size={24} />
            </button>
          )}
          <button onClick={handleDownload} className="p-2 rounded-full bg-black/20 text-white backdrop-blur-md">
            <Download size={24} />
          </button>
          <button onClick={handleShare} className="p-2 rounded-full bg-black/20 text-white backdrop-blur-md">
            <Share2 size={24} />
          </button>
          <button className="p-2 rounded-full bg-black/20 text-white backdrop-blur-md hidden">
            <MoreHorizontal size={24} />
          </button>
        </div>
      </div>

      {/* Image Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        <motion.img 
          key={photo.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          src={photo.url} 
          alt={photo.caption} 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          decoding="async"
        />
        
        {/* Desktop Navigation Arrows */}
        {hasPrev && (
          <button 
            onClick={navigateToPrev}
            className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition-colors z-10"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        {hasNext && (
          <button 
            onClick={navigateToNext}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition-colors z-10"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Sidebar / Bottom Info */}
      <div className="bg-surface w-full md:w-96 flex flex-col rounded-t-3xl md:rounded-none md:border-l md:border-border">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-6 border-b border-border">
          <button 
            onClick={() => onNavigate('album', { albumId: photo.albumId })}
            className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back to Album</span>
          </button>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button onClick={() => setIsDeleteModalOpen(true)} className="text-red-500 hover:text-red-400 p-2 transition-colors">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={handleDownload} className="text-text-muted hover:text-text-main p-2">
              <Download size={20} />
            </button>
            <button className="text-text-muted hover:text-text-main p-2">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <img 
              src={photo.authorAvatarUrl || "https://picsum.photos/seed/user/100/100"} 
              alt={photo.authorName || "User"} 
              className="w-10 h-10 rounded-full object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="font-medium text-text-main text-base">{photo.authorName || "Family Member"}</p>
              <p className="text-xs text-text-muted">{photo.date}</p>
            </div>
          </div>

          <p className="text-text-main text-xl font-medium mb-6 leading-snug">{photo.caption}</p>

          <div className="flex items-center gap-6 border-y border-border py-4 mb-6 relative">
            <div className="relative group flex items-center gap-2">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-primary' : 'text-text-main hover:text-primary'}`}
              >
                <Heart size={24} className={isLiked ? 'fill-current' : ''} />
                <span className="font-medium">{photo.likes}</span>
              </button>
              
              {/* Display active reactions */}
              {photo.reactions && Object.entries(photo.reactions).map(([emoji, users]) => {
                const userArray = users as string[];
                return userArray.length > 0 && (
                  <button 
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium transition-colors ${userArray.includes(user?.uid || '') ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface border border-border text-text-main hover:bg-border/50'}`}
                  >
                    <span>{emoji}</span>
                    <span>{userArray.length}</span>
                  </button>
                );
              })}
              
              {/* Rich Reactions Popup */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex items-center gap-2 bg-surface border border-border p-2 rounded-full shadow-lg z-20">
                {['❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                  <button 
                    key={emoji}
                    className="text-2xl hover:scale-125 transition-transform origin-bottom"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-text-main ml-auto">
              <MessageCircle size={24} />
              <span className="font-medium">{photo.comments}</span>
            </div>
            <div className="relative">
              <button onClick={handleShare} className="flex items-center gap-2 text-text-main hover:text-primary transition-colors ml-auto">
                <Share2 size={24} />
              </button>
              
              {isShareMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-30 overflow-hidden flex flex-col">
                  {/* Clipboard direct photo share */}
                  <button onClick={copyImageToClipboard} className="flex flex-col items-start px-4 py-3 text-sm font-medium text-text-main hover:bg-primary/5 transition-colors text-left group">
                    <div className="flex items-center gap-3 w-full">
                      <Copy size={16} className="text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-primary">Copy Photo</span>
                    </div>
                  </button>

                  {/* Fallback to links */}
                  <button onClick={shareToWhatsApp} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-border/50 transition-colors text-left border-t border-border/50">
                    <MessageCircle size={16} className="text-green-500" />
                    Share Link
                  </button>
                  <button onClick={shareToFacebook} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-border/50 transition-colors text-left border-t border-border/50">
                    <Facebook size={16} className="text-blue-500" />
                    Share Link
                  </button>
                  <button onClick={shareCopiedLink} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-border/50 transition-colors text-left border-t border-border/50">
                    <LinkIcon size={16} className="text-text-main" />
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h4 className="font-serif font-medium text-text-main mb-4 text-lg">Comments</h4>
            {comments.length === 0 ? (
              <p className="text-sm text-text-muted">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img 
                    src={comment.authorAvatarUrl || "https://picsum.photos/seed/user/100/100"} 
                    alt={comment.authorName} 
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-main">{comment.authorName} <span className="text-xs text-text-muted font-normal ml-2">Just now</span></p>
                    <p className="text-sm text-text-muted mt-0.5">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Comment Input */}
        <div className="p-4 border-t border-border bg-background pb-safe">
          <form onSubmit={handleAddComment} className="flex items-center gap-3">
            <img 
              src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} 
              alt={user?.displayName || "User"} 
              className="w-8 h-8 rounded-full object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-surface border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors focus:shadow-sm"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="text-primary font-medium text-sm px-2 disabled:opacity-50 hover:opacity-80 transition-opacity"
            >
              Post
            </button>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-border"
          >
            <h3 className="text-2xl font-bold text-text-main mb-2">Delete Photo</h3>
            <p className="text-text-muted mb-6">Are you sure you want to delete this photo? This action cannot be undone.</p>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-full font-medium text-text-muted hover:bg-border/50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
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
