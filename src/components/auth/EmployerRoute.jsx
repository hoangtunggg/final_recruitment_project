import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AuthGateLoading from "./AuthGateLoading";

const EmployerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <AuthGateLoading />;

  // Not signed in -> login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only employers and admins may use the employer portal
  if (user.role !== "employer" && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default EmployerRoute;
