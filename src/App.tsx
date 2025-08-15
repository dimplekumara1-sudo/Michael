import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UpcomingEvents from './pages/UpcomingEvents';
import ManageWebsite from './pages/ManageWebsite';
import QRScannerPage from './pages/QRScannerPage';
import ContactPage from './pages/ContactPage';
import LatestWorkGallery from './pages/LatestWorkGallery';
import AboutPage from './pages/AboutPage';
import Footer from './components/Footer';
import InputTestComponent from './components/InputTestComponent';
import RegistrationTest from './pages/RegistrationTest';
import BlogListPage from './pages/BlogListPage';
import BlogDetailPage from './pages/BlogDetailPage';
import BlogEditorDemo from './pages/BlogEditorDemo';
import BlogsEdit from './pages/BlogsEdit';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            <Navbar />
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/latest-work" element={<LatestWorkGallery />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/qr-scanner" element={<QRScannerPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/blog-editor-demo" element={<BlogEditorDemo />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upcoming-events" 
              element={
                <ProtectedRoute requireAdmin>
                  <UpcomingEvents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-website" 
              element={
                <ProtectedRoute requireAdmin>
                  <ManageWebsite />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blogs-edit" 
              element={
                <ProtectedRoute requireAdmin>
                  <BlogsEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            <Route path="/input-test" element={<InputTestComponent />} />
            <Route path="/registration-test" element={<RegistrationTest />} />
          </Routes>
          <Footer />
        </div>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;