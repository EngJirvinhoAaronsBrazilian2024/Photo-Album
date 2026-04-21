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

  const bottomNavItems = navItems.filter(i => ['dashboard', 'timeline', 'album', 'upload'].includes(i.id));

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-b border-border h-16 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-text-main font-serif font-bold text-xl">
           <ImageIcon className="text-primary w-6 h-6" />
           <span className="tracking-tight">FamilyAlbum</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('notifications')}
            className={`p-2 rounded-full transition-colors ${currentScreen === 'notifications' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-border/50'}`}
          >
            <Bell size={20} />
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-colors ${currentScreen === 'profile' ? 'border-primary' : 'border-transparent'}`}
          >
            <img 
              src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} 
              alt="Profile" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border pb-safe z-50">
        <div className="flex justify-around items-center h-20 px-2 sm:px-4">
          {bottomNavItems.map(({ id, icon: Icon, label }) => {
            const isActive = currentScreen === id || (currentScreen === 'photo' && id === 'album');
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex flex-col items-center justify-center min-w-[64px] h-full space-y-1 transition-colors px-1 ${
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-80 fixed top-0 bottom-0 left-0 bg-surface border-r border-border z-50">
        <div className="p-10 border-b border-border">
          <h1 className="text-4xl font-serif font-medium tracking-tight text-text-main flex items-center gap-4">
            <ImageIcon className="text-primary w-10 h-10" />
            FamilyAlbum
          </h1>
        </div>
        
        <nav className="flex-1 px-6 space-y-4 mt-8">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = currentScreen === id || (currentScreen === 'photo' && id === 'album');
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-5 w-full px-6 py-5 rounded-[2rem] transition-all text-xl ${
                  isActive 
                    ? 'bg-primary-light text-primary font-bold shadow-sm' 
                    : 'text-text-muted hover:bg-border/50 hover:text-text-main font-medium'
                }`}
              >
                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-border">
          <button 
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-4 w-full p-4 rounded-3xl hover:bg-border/50 transition-colors text-left"
          >
            <img 
              src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} 
              alt={user?.displayName || "User"} 
              className="w-16 h-16 rounded-full object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-xl font-bold text-text-main truncate">{user?.displayName || "Anonymous User"}</p>
              <p className="text-base text-text-muted truncate">{user?.email || ""}</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
