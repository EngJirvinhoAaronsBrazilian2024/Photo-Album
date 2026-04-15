import { motion } from 'motion/react';
import { Settings, LogOut, ChevronRight, Bell, Shield, HelpCircle } from 'lucide-react';
import { Screen } from '../types';
import { useAuth } from '../AuthContext';
import { auth, signOut } from '../firebase';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function ProfileScreen({ onNavigate }: Props) {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onNavigate('login');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <div className="pb-24 md:pb-8 max-w-2xl mx-auto">
      <header className="mb-10 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative inline-block mb-4"
        >
          <img 
            src={user?.photoURL || "https://picsum.photos/seed/user/200/200"} 
            alt={user?.displayName || "User"} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-surface shadow-sm"
            referrerPolicy="no-referrer"
          />
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-surface hover:bg-primary/90 transition-colors">
            <Settings size={16} />
          </button>
        </motion.div>
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-text-main mb-1"
        >
          {user?.displayName || "Anonymous User"}
        </motion.h1>
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-text-muted"
        >
          {user?.email || "No email"}
        </motion.p>
      </header>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3 px-4">Account Settings</h2>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-background transition-colors border-b border-border">
              <div className="flex items-center gap-3 text-text-main">
                <div className="w-8 h-8 rounded-full bg-primary-light/30 text-primary flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <span className="font-medium">Personal Information</span>
              </div>
              <ChevronRight size={20} className="text-text-muted" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-background transition-colors border-b border-border">
              <div className="flex items-center gap-3 text-text-main">
                <div className="w-8 h-8 rounded-full bg-primary-light/30 text-primary flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <span className="font-medium">Notifications</span>
              </div>
              <ChevronRight size={20} className="text-text-muted" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-background transition-colors">
              <div className="flex items-center gap-3 text-text-main">
                <div className="w-8 h-8 rounded-full bg-primary-light/30 text-primary flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <span className="font-medium">Privacy & Security</span>
              </div>
              <ChevronRight size={20} className="text-text-muted" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3 px-4">Support</h2>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-background transition-colors">
              <div className="flex items-center gap-3 text-text-main">
                <div className="w-8 h-8 rounded-full bg-border text-text-muted flex items-center justify-center">
                  <HelpCircle size={18} />
                </div>
                <span className="font-medium">Help Center</span>
              </div>
              <ChevronRight size={20} className="text-text-muted" />
            </button>
          </div>
        </section>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-medium hover:bg-red-50 rounded-2xl transition-colors mt-8"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </div>
  );
}
