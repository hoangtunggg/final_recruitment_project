import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AuthGateLoading from "./AuthGateLoading";

/**
 * ProtectedRoute restricts access to authenticated users only.
 * @param {React.ReactNode} props.children - rendered when authenticated
 * @param {string} props.redirectTo - where anonymous visitors go (default "/login"); the
 *        original location (including ?query) is passed along so login can return to it.
 */
const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthGateLoading />;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
