import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import authApi from "../services/authApi";

const AuthContext = createContext(null);

const getSafeCandidateReturnPath = (returnTo) => {
  if (!returnTo) return "/";

  const path =
    typeof returnTo === "string"
      ? returnTo
      : `${returnTo.pathname || ""}${returnTo.search || ""}${returnTo.hash || ""}`;

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/login") ||
    path.startsWith("/register")
  ) {
    return "/";
  }

  return path;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  // Only the very first session check replaces the page with a spinner. login()/register() also
  // toggle `loading`, but must not unmount the form (it would lose the typed values and any inline error).
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Logout user
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Remove the Authorization header from axios
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    navigate("/login");
  }, [navigate]);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (
        storedToken &&
        storedToken !== "undefined" &&
        storedToken !== "null"
      ) {
        setToken(storedToken);
        setAuthToken(storedToken);
        try {
          // Verify token with backend
          const response = await authApi.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          } else {
            // Token is invalid, clear it
            logout();
          }
        } catch (err) {
          console.error("Authentication check failed:", err);
          logout();
        }
      }
      setLoading(false);
      setInitializing(false);
    };

    checkAuth();
  }, [logout]);

  // Login user
  const login = async (email, password, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);

      if (response.success) {
        const authData = response.data;
        const { token: newToken, ...userData } = authData;

        // Save token and user data
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setAuthToken(newToken);
        setUser(userData);

        // Preserve role portals and legitimate protected-route returns while
        // making the shared homepage the normal Candidate destination.
        const redirectPath =
          userData.role === "admin"
            ? "/admin"
            : userData.role === "employer"
            ? "/employer"
            : getSafeCandidateReturnPath(options.returnTo);
        navigate(redirectPath);

        return { success: true };
      } else {
        setError(response.error || "Login failed");
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Login failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(userData);

      if (response.success) {
        const authData = response.data;
        const { token: newToken, ...userResponseData } = authData;

        // Save token and user data
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userResponseData));
        setToken(newToken);
        setAuthToken(newToken);
        setUser(userResponseData);

        // Redirect based on user role
        const redirectPath =
          userResponseData.role === "admin"
            ? "/admin"
            : userResponseData.role === "employer"
            ? "/employer"
            : "/dashboard";
        navigate(redirectPath);

        return { success: true };
      } else {
        setError(response.error || "Registration failed");
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Registration failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await authApi.updateProfile(userData);
      if (response.success) {
        setUser((prev) => ({ ...prev, ...response.data }));
        // Update stored user data
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, ...response.data })
        );
      }
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authApi.changePassword(
        currentPassword,
        newPassword
      );
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to change password";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if user has all of the specified roles
  const hasAllRoles = (roles) => {
    return roles.every((role) => user?.role === role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        setError,
      }}
    >
      {initializing ? (
        <div
          role="status"
          className="flex min-h-screen items-center justify-center bg-canvas"
        >
          <div className="flex flex-col items-center gap-4 text-primary-500">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent" />
            <p className="font-medium text-muted">{t("states.loading")}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
