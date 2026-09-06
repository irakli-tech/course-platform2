import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * requireRole="teacher" | "student" (optional) - თუ მითითებულია, მხოლოდ
 * იმ როლის მქონე ავტორიზებულ მომხმარებელს გაუშვებს შიგნით.
 */
const ProtectedRoute = ({ children, requireRole }) => {
  const { user, token, authLoading } = useContext(AuthContext);

  if (token && authLoading) {
    return <div className="loading-spinner">მოწმდება ავტორიზაცია...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
