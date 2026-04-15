import { Home, Image as ImageIcon, PlusSquare, User, Clock, Bell } from 'lucide-react';
import { Screen } from '../types';
import { useAuth } from '../AuthContext';

interface Props {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Navigation({ currentScreen, onNavigate }: Props) {
  const { user } = useAuth();
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'timeline', icon: Clock, label: 'Timeline' },
    { id: 'album', icon: ImageIcon, label: 'Albums' },
    { id: 'upload', icon: PlusSquare, label: 'Upload' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-t border-border pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = currentScreen === id || (currentScreen === 'photo' && id === 'album');
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-surface border-r border-border z-50">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-medium tracking-tight text-text-main flex items-center gap-2">
            <ImageIcon className="text-primary" />
            FamilyAlbum
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = currentScreen === id || (currentScreen === 'photo' && id === 'album');
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary-light text-primary font-medium' 
                    : 'text-text-muted hover:bg-border/50 hover:text-text-main'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-border/50 transition-colors text-left"
          >
            <img 
              src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} 
              alt={user?.displayName || "User"} 
              className="w-10 h-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-text-main truncate">{user?.displayName || "Anonymous User"}</p>
              <p className="text-xs text-text-muted truncate">{user?.email || ""}</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
