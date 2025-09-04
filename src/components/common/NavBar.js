import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./NavBar.css";
import { LoggedInUserContext } from '../../contexts/LoggedInUserContext';
import { useAuth } from '../../hooks/useAuth';
import { cookieUtils } from '../../utils/storageUtils';
import { ROUTE_PATHS } from '../../constants';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';

const NavBar = () => {
  const { logout } = useAuth();
  const context = useContext(LoggedInUserContext);
  
  const {
    userGuideClicked, 
    setUserGuideClicked,
    navbarOpen, 
    showNavbarTitle, 
    narrowScreen
  } = context || {};

  const [clickedDashboard, setClickedDashboard] = useState(true);
  const [clickedHistory, setClickedHistory] = useState(false);
  const [sessionTimeoutOpen, setSessionTimeoutOpen] = useState(false);

  const userLoggedIn = localStorage.getItem("loggedIn");

  const checkSession = () => {
    const userCookie = cookieUtils.get('userLogInCookie');
    if (!userCookie) {
      setSessionTimeoutOpen(true);
    }
  };

  const handleSessionTimeoutClose = () => {
    setSessionTimeoutOpen(false);
    logout();
  };

  const toDashboardTab = () => {
    checkSession();
    setClickedDashboard(true);
    setClickedHistory(false);
    setUserGuideClicked?.(false);
  };

  const toHistoryTab = () => {
    checkSession();
    setClickedHistory(true);
    setClickedDashboard(false);
    setUserGuideClicked?.(false);
  };

  const SessionTimeoutDialog = () => (
    <Dialog
      open={sessionTimeoutOpen}
      onClose={handleSessionTimeoutClose}
      PaperProps={{
        className: 'session-timeout-dialog',
        style: {
          backgroundColor: '#f7f7f7',
          borderRadius: '5px', 
          minWidth: '200px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
        Session Timeout
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center' }}>
          Your session has expired due to inactivity. Please log in again.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button onClick={handleSessionTimeoutClose} variant="contained" color="success">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!navbarOpen) return null;

  return (
    <div>
      <div className={narrowScreen ? 'navbar-narrow' : 'navbar'}>
        {userLoggedIn && (
          <div className="navbar-links">
            {showNavbarTitle ? (
              <div className="navbar-item"> 
                <Link 
                  to={ROUTE_PATHS.DASHBOARD} 
                  className={
                    (clickedDashboard && !userGuideClicked) 
                      ? "navbar-item-link-clicked" 
                      : "navbar-item-link"
                  } 
                  onClick={toDashboardTab}
                > 
                  <HomeIcon className="navbar-icon" />
                  Dashboard
                </Link> 
              </div>
            ) : (
              <div className="navbar-item"> 
                <Link 
                  to={ROUTE_PATHS.DASHBOARD} 
                  className={
                    (clickedDashboard && !userGuideClicked) 
                      ? "navbar-item-link-clicked" 
                      : "navbar-item-link"
                  } 
                  onClick={toDashboardTab}
                > 
                  <HomeIcon className="navbar-icon-in-narrow-mode" />
                </Link> 
              </div>
            )}
            
            {showNavbarTitle ? (
              <div className="navbar-item">
                <Link 
                  to={ROUTE_PATHS.HISTORY} 
                  className={
                    (clickedHistory && !userGuideClicked) 
                      ? "navbar-item-link-clicked" 
                      : "navbar-item-link"
                  } 
                  onClick={toHistoryTab}
                > 
                  <CalendarMonthIcon className="navbar-icon" />
                  History
                </Link>
              </div>
            ) : (
              <div className="navbar-item">
                <Link 
                  to={ROUTE_PATHS.HISTORY} 
                  className={
                    (clickedHistory && !userGuideClicked) 
                      ? "navbar-item-link-clicked" 
                      : "navbar-item-link"
                  } 
                  onClick={toHistoryTab}
                > 
                  <CalendarMonthIcon className="navbar-icon-in-narrow-mode" />
                </Link>
              </div>
            )}
          </div> 
        )}
        
        <SessionTimeoutDialog />
      </div>
    </div>
  );
};

export default NavBar;