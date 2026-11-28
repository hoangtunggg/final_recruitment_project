import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaLock } from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import { Button, EmptyState } from "../ui";
import AuthGateLoading from "./AuthGateLoading";

/**
 * AdminRoute restricts access to admin users only.
 * @param {React.ReactNode} props.children - rendered when the user is an admin
 * @param {string} props.redirectTo - where non-admins are sent (default "/dashboard")
 */
const AdminRoute = ({ children, redirectTo = "/dashboard" }) => {
  const { t } = useTranslation("auth");
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <AuthGateLoading message={t("guard.checkingPermissions")} />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md">
          <EmptyState
            icon={<FaLock />}
            title={t("guard.accessDenied")}
            description={t("guard.adminOnly")}
            action={<Button onClick={() => navigate(redirectTo)}>{t("guard.goDashboard")}</Button>}
          />
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
