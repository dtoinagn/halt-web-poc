import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import "./TopBar.css";
import Logo from "./logo.png";
import { useNavigate } from "react-router-dom";
import { LoggedInUserContext } from "../../contexts/LoggedInUserContext";
import { useAuth } from "../../hooks/useAuth";
import { authUtils, cookieUtils } from "../../utils/storageUtils";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import HelpIcon from "@mui/icons-material/Help";
import MenuIcon from "@mui/icons-material/Menu";
import { ROUTE_PATHS } from "../../constants";

const TopBar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const context = useContext(LoggedInUserContext);

  const {
    navbarOpen,
    setNavbarOpen,
    setShowNavbarTitle,
    setNarrowScreen,
    setUserGuideClicked,
  } = context || {};

  const [showTitle, setShowTitle] = useState(false);

  const inactivityTimeoutRef = useRef(null);
  const sessionMonitorIntervalRef = useRef(null);

  useEffect(() => {
    const updateParameters = () => {
      if (window.innerWidth < 1700) {
        setShowNavbarTitle?.(false);
        setNarrowScreen?.(true);
      } else {
        setShowTitle(true);
        setShowNavbarTitle?.(true);
        setNarrowScreen?.(false);
      }

      if (window.innerWidth < 980) {
        setShowTitle(false);
      } else {
        setShowTitle(true);
      }
    };

    window.addEventListener("resize", updateParameters);
    updateParameters();

    return () => window.removeEventListener("resize", updateParameters);
  }, [setShowNavbarTitle, setNarrowScreen]);

  const userLoggedIn = authUtils.isLoggedIn();
  const user = authUtils.getLoggedInUser();

  let init = null;
  if (user && user !== "notLoggedIn" && user.length >= 2) {
    const initial = user[0] + user[1];
    init = initial.toUpperCase();
  }

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleUserGuide = () => {
    setUserGuideClicked?.(true);
    navigate(ROUTE_PATHS.USER_GUIDE);
  };

  const handleMenu = () => {
    setNavbarOpen?.(!navbarOpen);
  };

  // Session monitoring - handles inactivity, cookie expiration, and closing hours
  useEffect(() => {
    if (!userLoggedIn) return;

    const {
      closingHour = 17,
      openingHour = 6,
      inactivityLimitMinute = 15,
    } = window.runConfig || {};

    const isAfterHours = () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= closingHour || hour < openingHour;
    };

    const resetInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      if (isAfterHours()) {
        inactivityTimeoutRef.current = setTimeout(
          handleLogout,
          inactivityLimitMinute * 60 * 1000
        );
      }
    };

    // Setup inactivity monitoring
    const events = ["mousemove", "keydown", "click"];
    events.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );
    resetInactivityTimer();

    // Function to check cookie expiration and closing hour
    const checkSessionStatus = () => {
      const now = new Date();

      // Check cookie expiration
      const userCookie = cookieUtils.get('userLogInCookie');
      if (!userCookie) {
        // Clear all timers
        if (sessionMonitorIntervalRef.current) {
          clearInterval(sessionMonitorIntervalRef.current);
        }
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
        handleLogout();
        return;
      }

      // Check closing hour
      if (now.getHours() === closingHour && now.getMinutes() === 0) {
        handleLogout();
      }
    };

    // Check session status immediately
    checkSessionStatus();

    // Single interval to check cookie expiration and closing hour periodically
    sessionMonitorIntervalRef.current = setInterval(checkSessionStatus, 5000); // Check every 5 seconds

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
      if (sessionMonitorIntervalRef.current) {
        clearInterval(sessionMonitorIntervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [userLoggedIn, handleLogout]);

  return (
    <div className="topbar">
      <MenuIcon
        onClick={handleMenu}
        className="topbar-menubutton"
        fontSize="large"
      />

      <img className="topbar-ciro-logo" src={Logo} alt="ciro company logo" />
      {showTitle && (
        <div className="topbar-header">
          CIRO Equity Trading Halt Management Portal
        </div>
      )}

      {userLoggedIn && showTitle && (
        <HelpIcon
          onClick={handleUserGuide}
          className="topbar-guide"
          fontSize="large"
        />
      )}
      {userLoggedIn && showTitle && init && (
        <div className="topbar-profilepic">{init}</div>
      )}
      {userLoggedIn && showTitle && (
        <LogoutIcon
          onClick={handleLogout}
          className="topbar-logoutbutton"
          fontSize="large"
        />
      )}
    </div>
  );
};

export default TopBar;
