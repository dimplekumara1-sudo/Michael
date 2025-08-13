import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, QrCode, UserPlus, LogIn, Calendar, Home, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLogout } from '../hooks/useLogout';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="https://res.cloudinary.com/drbyg8daj/image/upload/v1754757927/Untitled_6_-Photoroom_aw6w9g.png"
                alt="Micheal Photography Logo"
                className="h-12 md:h-16 w-auto max-w-[120px] sm:max-w-[180px] md:max-w-[300px] lg:max-w-[350px] object-contain transition-all duration-200"
                style={{ maxHeight: '80px' }}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/latest-work"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/latest-work') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Latest Work
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/about') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              About
            </Link>
            <Link
              to="/blog"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/blog') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/contact') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Contact
            </Link>
            <button
              onClick={() => navigate('/qr-scanner')}
              className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
              title="QR Scanner"
            >
              <QrCode className="h-5 w-5" />
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{profile?.name || user?.email?.split('@')[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <Link
                      to={isAdmin ? '/admin' : '/dashboard'}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          to="/upcoming-events"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Upcoming Events
                        </Link>
                        <Link
                          to="/manage-website"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Home className="h-4 w-4 mr-2" />
                          Manage Website
                        </Link>
                        <Link
                          to="/blogs-edit"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Blogs Edit
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/latest-work"
                className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Latest Work
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/blog"
                className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link>
              <Link
                to="/contact"
                className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/qr-scanner"
                className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Scanner
              </Link>
              
              {user ? (
                <>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-3 py-2 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{profile?.name || user?.email?.split('@')[0]}</span>
                    </div>
                  </div>
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/upcoming-events"
                        className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                        onClick={() => setIsOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Upcoming Events
                      </Link>
                      <Link
                        to="/manage-website"
                        className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                        onClick={() => setIsOpen(false)}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Manage Website
                      </Link>
                      <Link
                        to="/blogs-edit"
                        className="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                        onClick={() => setIsOpen(false)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Blogs Edit
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="px-3 py-2 text-left text-gray-700 hover:text-blue-600 transition-colors flex items-center w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <div className="px-3 space-y-3">
                      <Link
                        to="/login"
                        className="flex items-center justify-center w-full px-4 py-3 text-gray-700 hover:text-blue-600 border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                        onClick={() => setIsOpen(false)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;