import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import SocialIcon, { SOCIAL_LINKS } from './components/socialLinks';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateCoursePage from './pages/CreateCoursePage';
import EditCoursePage from './pages/EditCoursePage';
import MyCoursesPage from './pages/MyCoursesPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/create-course"
                element={
                  <ProtectedRoute requireRole="teacher">
                    <CreateCoursePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-course/:id"
                element={
                  <ProtectedRoute requireRole="teacher">
                    <EditCoursePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-courses"
                element={
                  <ProtectedRoute>
                    <MyCoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <div className="app-footer-socials">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon key={social.name} social={social} className="app-footer-social-link" />
              ))}
            </div>
            <span>© {new Date().getFullYear()} სასწავლო პორტალი ORION. ყველა უფლება დაცულია.</span>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
