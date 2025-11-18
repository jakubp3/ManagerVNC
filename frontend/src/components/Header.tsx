import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold">VNC Manager</h1>
          <nav className="flex space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-gray-300 transition text-sm sm:text-base px-2 py-1 rounded hover:bg-gray-700"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/activity-logs')}
              className="hover:text-gray-300 transition text-sm sm:text-base px-2 py-1 rounded hover:bg-gray-700"
            >
              Activity Logs
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className="hover:text-gray-300 transition text-sm sm:text-base px-2 py-1 rounded hover:bg-gray-700"
              >
                Admin Panel
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-300 break-all max-w-[200px] sm:max-w-none">{user?.email}</span>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded font-medium">
            {user?.role}
          </span>
          <button
            onClick={() => {
              const darkMode = localStorage.getItem('dark_mode') === 'true';
              const newMode = !darkMode;
              if (newMode) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
              localStorage.setItem('dark_mode', String(newMode));
              // Dispatch event to update dashboard state
              window.dispatchEvent(new CustomEvent('darkModeChange', { detail: newMode }));
            }}
            className="bg-gray-600 hover:bg-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition text-sm sm:text-base font-medium shadow-sm hover:shadow"
            title="Toggle dark mode"
          >
            {localStorage.getItem('dark_mode') === 'true' ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={() => {
              // This will be handled by DashboardPage
              const event = new CustomEvent('openSettings');
              window.dispatchEvent(event);
            }}
            className="bg-gray-600 hover:bg-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition text-sm sm:text-base font-medium shadow-sm hover:shadow"
            title="Settings"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition text-sm sm:text-base font-medium shadow-sm hover:shadow"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

