import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login page if token is missing
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
