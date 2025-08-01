import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('useLogout: Starting logout process...');
    
    try {
      // Perform logout from auth context
      await logout();
      console.log('useLogout: Auth context logout completed');
      
    } catch (error) {
      console.error('useLogout: Logout error:', error);
      
      // Force clear everything as fallback
      localStorage.clear();
      sessionStorage.clear();
      
    } finally {
      // Always redirect to home page regardless of success/failure
      console.log('useLogout: Redirecting to home page');
      navigate('/', { replace: true });
      
      // Force a page reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return handleLogout;
};