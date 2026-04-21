/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Screen } from './types';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { AlbumScreen } from './components/AlbumScreen';
import { UploadScreen } from './components/UploadScreen';
import { PhotoDetailScreen } from './components/PhotoDetailScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { TimelineScreen } from './components/TimelineScreen';
import { Navigation } from './components/Navigation';
import { useAuth } from './AuthContext';

export default function App() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      setCurrentScreen('login');
    } else if (!loading && user && currentScreen === 'login') {
      setCurrentScreen('dashboard');
    }
  }, [user, loading, currentScreen]);

  const handleNavigate = (screen: Screen, params?: { albumId?: string; photoId?: string }) => {
    if (params?.albumId) setSelectedAlbumId(params.albumId);
    if (params?.photoId) setSelectedPhotoId(params.photoId);
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-main">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium text-text-muted">Loading your memories...</p>
        </div>
      </div>
    );
  }

  if (!user || currentScreen === 'login') {
    return (
      <>
        <Toaster position="top-center" />
        <LoginScreen onNavigate={handleNavigate} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Toaster position="top-center" />
      <Navigation currentScreen={currentScreen} onNavigate={handleNavigate} />
      
      <main className="md:ml-80 pt-20 pb-28 px-4 md:p-8 md:pt-8 md:pb-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {currentScreen === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} />}
          {currentScreen === 'timeline' && <TimelineScreen onNavigate={handleNavigate} />}
          {currentScreen === 'album' && <AlbumScreen onNavigate={handleNavigate} albumId={selectedAlbumId} />}
          {currentScreen === 'upload' && <UploadScreen onNavigate={handleNavigate} />}
          {currentScreen === 'photo' && <PhotoDetailScreen onNavigate={handleNavigate} photoId={selectedPhotoId} />}
          {currentScreen === 'profile' && <ProfileScreen onNavigate={handleNavigate} />}
          {currentScreen === 'notifications' && (
            <div className="text-center py-16">
              <h1 className="text-3xl font-bold text-text-main mb-4">Notifications</h1>
              <p className="text-text-muted">Coming soon! You will see alerts for new albums and comments here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

