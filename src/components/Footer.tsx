import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Footer: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  const handleTabClick = (path: string) => {
    setActiveTab(path);
  };

  const dashboardPath = isAdmin ? '/admin' : '/user/dashboard';

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 border-t border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 py-2 md:hidden z-50">
      <div className="flex justify-around items-center px-2">
        <Link to="/" onClick={() => handleTabClick('/')}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${activeTab === '/' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${activeTab === '/' ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0'}`}>Home</span>
          </div>
        </Link>
        <Link to="/latest-work" onClick={() => handleTabClick('/latest-work')}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${activeTab === '/latest-work' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${activeTab === '/latest-work' ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0'}`}>Work</span>
          </div>
        </Link>
        <Link to="/contact" onClick={() => handleTabClick('/contact')}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${activeTab === '/contact' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${activeTab === '/contact' ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0'}`}>Booking</span>
          </div>
        </Link>
        <Link to="/blog" onClick={() => handleTabClick('/blog')}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${activeTab === '/blog' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-4 3h2m-4 3h2m-4 3h2" />
            </svg>
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${activeTab === '/blog' ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0'}`}>Blogs</span>
          </div>
        </Link>
        {user ? (
          <Link to={dashboardPath} onClick={() => handleTabClick(dashboardPath)}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${(activeTab.startsWith('/admin') || activeTab.startsWith('/user/dashboard')) ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${(activeTab.startsWith('/admin') || activeTab.startsWith('/user/dashboard')) ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0'}`}>Dashboard</span>
            </div>
          </Link>
        ) : (
          <Link to="/login" onClick={() => handleTabClick('/login')}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${activeTab === '/login' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${activeTab === '/login' ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0'}`}>Login / Signup</span>
            </div>
          </Link>
        )}
      </div>
    </footer>
  );
};

export default Footer;