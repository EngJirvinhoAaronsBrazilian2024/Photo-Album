import { useState } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../types';
import { auth, googleProvider, signInWithPopup, doc, setDoc, getDoc, db, serverTimestamp } from '../firebase';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function LoginScreen({ onNavigate }: Props) {
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || 'Anonymous User',
          email: user.email || 'no-email@example.com',
          avatarUrl: user.photoURL || '',
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing user document without changing createdAt
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || 'Anonymous User',
          email: user.email || 'no-email@example.com',
          avatarUrl: user.photoURL || ''
        }, { merge: true });
      }
      
      onNavigate('dashboard');
    } catch (err: any) {
      console.error("Error signing in with Google", err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by your browser. Please allow popups or open this app in a new tab to sign in.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Full-screen Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2000&auto=format&fit=crop" 
          alt="Family Memories" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Overlays for readability and theme blending */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 mix-blend-multiply" />
      </div>

      {/* Form Section */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-surface/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10"
        >
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-calligraphy text-primary mb-6 drop-shadow-sm leading-tight">
              The Late George Family Album
            </h1>
            
            {/* Family Photo Boundary */}
            <div className="mx-auto w-full max-w-[320px] aspect-[4/3] rounded-[10px] overflow-hidden border-4 border-white/40 dark:border-white/20 shadow-xl mb-6 relative bg-black/10">
              <img 
                src="/family-photo.jpg.jpeg" 
                alt="The Late George Family" 
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  // Fallback placeholder until the user uploads their specific photo to the file explorer
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop";
                }}
              />
            </div>

            <p className="text-text-muted font-medium">Sign in to preserve your cherished memories</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-500 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-surface border border-border text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-text-muted">
              Preserve your family's legacy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
