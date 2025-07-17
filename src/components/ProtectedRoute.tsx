import * as React from 'react';
import { Navigate } from 'react-router-dom';

import PocketBase from 'pocketbase'


const pb = new PocketBase('https://zenithdb.fly.dev');



interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!pb.authStore.isValid) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute; 