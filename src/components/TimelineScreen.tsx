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
              <h2 className="text-2xl font-bold text-text-main mb-6 sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
