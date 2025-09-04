import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';
import { apiService } from '../services/api';
import { authUtils, cookieUtils } from '../utils/storageUtils';
import { ROUTE_PATHS } from '../constants';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const context = useContext(LoggedInUserContext);

  const login = async (credentials) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.login(credentials);
      
      if (response.status === "SUCCESS") {
        // Update context
        if (context) {
          context.setLoggedInUser(response.username);
          context.setLoggedIn(true);
        }

        // Store authentication data
        authUtils.setToken(response.jwt);
        authUtils.setLoggedIn(true);
        authUtils.setLoggedInUser(response.username);

        // Set user cookie
        const { userLogInCookieExpirationMinute } = window.runConfig || {};
        if (userLogInCookieExpirationMinute) {
          cookieUtils.set('userLogInCookie', response.username, {
            expires: new Date(Date.now() + userLogInCookieExpirationMinute * 60 * 1000)
          });
        }

        navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
        return { success: true };
      } else if (response.status === "FAIL") {
        let errorMessage = "Login failed. Please try again.";
        
        if (response.httpStatus === "UNAUTHORIZED") {
          errorMessage = "Login Failed. The username or password you entered is incorrect. Please try again or contact support team for assistance.";
        } else if (response.httpStatus === "FORBIDDEN") {
          errorMessage = "Access Denied. Please contact the Support Team for access.";
        } else if (response.httpStatus === "INTERNAL_SERVER_ERROR") {
          errorMessage = "Connection lost. Please contact the Support Team for further assistance.";
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
      context.setLoggedInUser('notLoggedIn');
      context.setLoggedIn(false);
    }
    navigate(ROUTE_PATHS.LOGIN, { replace: true });
    window.location.reload();
  };

  const checkSession = () => {
    const userCookie = cookieUtils.get('userLogInCookie');
    return !!userCookie;
  };

  return {
    login,
    logout,
    checkSession,
    loading,
    error,
    isAuthenticated: authUtils.isLoggedIn(),
    currentUser: authUtils.getLoggedInUser()
  };
};