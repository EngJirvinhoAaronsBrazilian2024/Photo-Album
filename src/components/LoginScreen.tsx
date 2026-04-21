import { useState } from 'react';
import { motion } from 'motion/react';
import { BookImage } from 'lucide-react';
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
      }
      // If user exists, we skip updating to avoid triggering strict schema checks
      // on unchanged legacy fields or immutable createdAt comparisons that might fail.
      
      onNavigate('dashboard');
    } catch (err: any) {
      console.error("Error signing in with Google", err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by your browser. Please allow popups or open this app in a new tab to sign in.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/cross-origin-cookies-blocked' || err.message?.includes('cross-origin')) {
         setError('Sign-in blocked by browser settings in this preview frame. Please click "Open in New Tab" to sign in.');
      } else {
        setError(`Failed: ${err.message || err.toString()}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Full-screen Background Image with Ken Burns */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2000&auto=format&fit=crop"
          alt="Beautiful Warm Sunset Background"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />
        {/* Lighter gradient overlays to ensure the image pops clearly while keeping text readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between p-6 sm:p-12 lg:p-16 gap-12 lg:gap-24">
        
        {/* Left Text */}
        <div className="w-full lg:w-1/2 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-5xl lg:text-7xl font-serif font-bold tracking-tight mb-6 text-white drop-shadow-xl leading-tight">
              Timeless memories,<br/>beautifully preserved.
            </h2>
            <p className="text-xl lg:text-2xl font-medium text-white/95 drop-shadow-md max-w-lg">
              Every family has a story. Welcome to a private space dedicated to yours.
            </p>
          </motion.div>
        </div>

        {/* Right Form Card */}
        <div className="w-full lg:w-1/2 max-w-md relative">
          {/* Subtle background glow for the form side (warm sunset tones) */}
          <motion.div 
            className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"
            animate={{ y: [0, 30, 0], scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-rose-500/20 rounded-full blur-[80px] pointer-events-none"
            animate={{ y: [0, -30, 0], scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative z-10 bg-white/10 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <div className="flex flex-col">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-10"
              >
                <h1 className="text-4xl md:text-5xl font-calligraphy text-white mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-tight">
                  The Late George<br/>Family Album
                </h1>
                
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: 48 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                  className="h-1 bg-amber-300 rounded-full mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                ></motion.div>

                <p className="text-xl text-white font-medium mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Welcome back.</p>
                <p className="text-base text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">Sign in to access and preserve your shared family history.</p>
              </motion.div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-8 p-4 bg-red-500/80 backdrop-blur-md border border-red-400 rounded-xl text-white text-sm font-bold shadow-lg"
                >
                  {error}
                </motion.div>
              )}

              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white border border-white/40 text-neutral-800 rounded-2xl text-lg font-bold hover:bg-neutral-50 hover:shadow-lg transition-all group relative overflow-hidden active:scale-95"
              >
                {/* Button shimmer effect */}
                <motion.div 
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent w-full h-full skew-x-12 z-0 opacity-50"
                  animate={{ translateX: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                />
                <div className="bg-white p-1 rounded-full shadow-sm relative z-10">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                </div>
                <span className="relative z-10">Sign in with Google</span>
              </motion.button>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-10 text-center pb-2"
              >
                 <p className="text-sm font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] italic">
                  Securely authenticated via Google.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
