import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Screen, Photo } from '../types';
import { useAuth } from '../AuthContext';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';

interface Props {
  onNavigate: (screen: Screen, params?: { photoId?: string }) => void;
}

export function TimelineScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const photosQuery = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
    const unsubscribePhotos = onSnapshot(photosQuery, (snapshot) => {
      const photosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      setPhotos(photosData);
      setLoading(false);
    });

    return () => unsubscribePhotos();
  }, [user]);

  // Group photos by month and year
  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!photo.date) return acc;
    // Assuming date format is YYYY-MM-DD or similar
    const dateObj = new Date(photo.date);
    if (isNaN(dateObj.getTime())) return acc;
    
    const monthYear = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading timeline...</div>;
  }

  return (
    <div className="pb-24 md:pb-8">
      <header className="mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold tracking-tight text-text-main mb-2"
        >
          Family Timeline
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-text-muted text-lg font-medium"
        >
          Scroll back through your family's history.
        </motion.p>
      </header>

      {Object.keys(groupedPhotos).length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-3xl border border-border shadow-sm">
          <p className="text-text-muted mb-4 font-medium">No photos in your timeline yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedPhotos).map(([monthYear, monthPhotos]) => (
            <div key={monthYear}>
              <h2 className="text-2xl font-bold text-text-main mb-6 sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10 transition-all">
                {monthYear}
              </h2>
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6">
                {(monthPhotos as Photo[]).map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onNavigate('photo', { photoId: photo.id })}
                    className="break-inside-avoid mb-6 cursor-pointer relative group transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:z-10"
                  >
                    <div className="bg-white dark:bg-neutral-800 p-3 pb-12 md:p-4 md:pb-16 shadow-md hover:shadow-2xl border border-gray-200 dark:border-gray-700 relative">
                      <img 
                        src={photo.url} 
                        alt={photo.caption || "Photo"} 
                        className="w-full h-auto object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                      
                       {/* Subtle photo mount tape detail */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/40 backdrop-blur-sm border border-white/20 shadow-sm -rotate-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                      
                      {photo.caption && (
                        <div className="absolute bottom-3 md:bottom-4 left-4 right-4 text-center">
                          <p className="text-gray-800 dark:text-gray-200 text-sm md:text-base font-medium line-clamp-1 italic font-serif">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
