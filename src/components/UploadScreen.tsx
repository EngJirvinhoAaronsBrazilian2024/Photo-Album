import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { Screen, Album } from '../types';
import { useAuth } from '../AuthContext';
import { db, collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, increment, storage, ref, uploadBytesResumable, getDownloadURL } from '../firebase';

interface Props {
  onNavigate: (screen: Screen, params?: { albumId?: string }) => void;
}

export function UploadScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');

  useEffect(() => {
    const fetchAlbums = async () => {
      const snapshot = await getDocs(collection(db, 'albums'));
      const albumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
      setAlbums(albumsData);
      if (albumsData.length > 0) {
        setSelectedAlbumId(albumsData[0].id);
      }
    };
    fetchAlbums();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user || !selectedAlbumId) return;
    setIsUploading(true);
    setProgress(10);
    
    try {
      // Fallback: Compress and save Base64 directly to database to bypass Storage bucket errors
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = async () => {
          setProgress(40);
          const canvas = document.createElement('canvas');
          let MAX_WIDTH = 1200;
          let MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG and dynamically lower quality until it fits comfortably within Firestore's 1MB limit.
          // Base64 adds ~33% overhead. A 1MB limit = ~1,048,000 bytes. We aim for < 800,000 chars.
          let quality = 0.8;
          let base64Url = canvas.toDataURL('image/jpeg', quality);

          while (base64Url.length > 800000 && quality > 0.1) {
            quality -= 0.15;
            base64Url = canvas.toDataURL('image/jpeg', quality);
          }
          
          // Fallback: If it's STILL too big, aggressively downscale dimensions
          if (base64Url.length > 800000) {
              width *= 0.6;
              height *= 0.6;
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);
              base64Url = canvas.toDataURL('image/jpeg', 0.5);
          }

          setProgress(70);

          try {
            await addDoc(collection(db, 'photos'), {
              albumId: selectedAlbumId,
              url: base64Url,
              caption,
              date: new Date().toLocaleDateString(),
              likes: 0,
              comments: 0,
              authorId: user.uid,
              authorName: user.displayName || 'Anonymous User',
              authorAvatarUrl: user.photoURL || '',
              createdAt: serverTimestamp()
            });

            // Update album photo count and cover
            await updateDoc(doc(db, 'albums', selectedAlbumId), {
              photoCount: increment(1),
              coverUrl: base64Url
            });

            setProgress(100);
            toast.success("Photo safely uploaded!");
            setTimeout(() => {
              onNavigate('album', { albumId: selectedAlbumId });
            }, 500);
          } catch (err: any) {
             console.error("Database error after upload:", err);
             toast.error(`Database Error: ${err.message || 'Failed to save photo record'}`);
             setIsUploading(false);
          }
        };
        
        img.onerror = () => {
          toast.error("Failed to read image format.");
          setIsUploading(false);
        };
      };
      
      reader.onerror = () => {
        toast.error("Failed to load file.");
        setIsUploading(false);
      };

    } catch (error) {
      console.error("Error processing photo", error);
      toast.error("Failed to process photo");
      setIsUploading(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8 max-w-2xl mx-auto">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-text-main">Upload Memory</h1>
        {file && !isUploading && (
          <button 
            onClick={() => setFile(null)}
            className="text-text-muted hover:text-text-main p-2"
          >
            <X size={28} />
          </button>
        )}
      </header>

      {!file ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-colors ${
            isDragging ? 'border-primary bg-primary-light/20' : 'border-border bg-surface'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-20 h-20 rounded-full bg-primary-light/50 flex items-center justify-center text-primary mb-6">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-main mb-2">Drag & drop your photos</h3>
          <p className="text-sm text-text-muted mb-8">High quality JPG, PNG, or HEIC files</p>
          
          <label className="px-6 py-3 bg-primary text-white text-sm rounded-full font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
            Browse Files
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl p-6 border border-border shadow-sm"
        >
          <div className="aspect-video rounded-xl overflow-hidden bg-border mb-6 flex items-center justify-center relative">
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              decoding="async"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-bold text-text-main mb-1.5">Caption</label>
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write something about this memory..."
                className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none h-24"
                disabled={isUploading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-text-main mb-1.5">Add to Album</label>
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none"
              >
                {albums.length === 0 && <option value="">No albums available</option>}
                {albums.map(album => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>
            </div>
          </div>

          {isUploading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-text-main">Uploading...</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button 
              onClick={handleUpload}
              disabled={!selectedAlbumId}
              className="w-full py-4 px-4 bg-primary text-white text-base rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Photo
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
