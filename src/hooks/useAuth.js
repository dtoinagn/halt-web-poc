import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LoggedInUserContext } from "../contexts/LoggedInUserContext";
import { apiService } from "../services/api";
import { authUtils, cookieUtils, permissionUtils } from "../utils/storageUtils";
import { parseJWT, getJWTPayload, isJWTExpired } from "../utils/jwtUtils";

import { ROUTE_PATHS } from "../constants";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const context = useContext(LoggedInUserContext);

  const login = async (credentials) => {
    setLoading(true);
    setError("");

    try {
      const response = await apiService.login(credentials);

      if (response.status === "SUCCESS") {
        // Update context
        if (context) {
          context.setLoggedInUser(response.username);
          context.setLoggedIn(true);
        }

        // Store authentication data
        const token = response.jwt;
        authUtils.setToken(token);
        const actions = 'actions' in response ? response.actions : null;
        permissionUtils.setPermissions(actions);
        if (context) {
          context.setPermissions(actions);
        }
        try {
          const parsed = parseJWT(token);
          console.log(parsed.header);
          console.log(parsed.payload);
          if (isJWTExpired(token)) {
            console.log("Token expired!");
          }
        } catch (jwtErr) {
          console.warn("Token is not a standard JWT:", jwtErr.message);
        }
        authUtils.setLoggedIn(true);
        authUtils.setLoggedInUser(response.username);

        // Set user cookie
        const { userLogInCookieExpirationMinute } = window.runConfig || {};
        if (userLogInCookieExpirationMinute) {
          cookieUtils.set("userLogInCookie", response.username, {
            expires: new Date(
              Date.now() + userLogInCookieExpirationMinute * 60 * 1000
            ),
          });
        }
        navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
        return { success: true };
      } else {
        let errorMessage = response.message;
        if (response.status === 401 || response.error === "Unauthorized") {
          errorMessage = response.message || "Invalid username or password";
          setError(errorMessage);
        } else if (response.status === 403) {
          errorMessage =
            "Access Denied. Please contact the Support Team for access.";
        } else if (response.status === 500) {
          errorMessage =
            "Internal Server Error. Please contact the Support Team for further assistance.";
        } else if (response.status >= 400) {
          errorMessage = response.message || "Bad Request. Please try again.";
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authUtils.logout();
    if (context) {
      context.setLoggedInUser("notLoggedIn");
      context.setLoggedIn(false);
      context.setPermissions([]);
    }
    navigate(ROUTE_PATHS.LOGIN, { replace: true });
    window.location.reload();
  };

  const checkSession = () => {
    const userCookie = cookieUtils.get("userLogInCookie");
    return !!userCookie;
  };

  const clearError = () => {
    setError('');
  };

  return {
    login,
    logout,
    checkSession,
    clearError,
    loading,
    error,
    isAuthenticated: authUtils.isLoggedIn(),
    currentUser: authUtils.getLoggedInUser(),
  };
};
