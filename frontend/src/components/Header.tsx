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
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">VNC Manager</h1>
          <nav className="flex space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-gray-300 transition"
            >
              Dashboard
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className="hover:text-gray-300 transition"
              >
                Admin Panel
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">{user?.email}</span>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
            {user?.role}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

