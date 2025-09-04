import React, {useState, useContext} from 'react';
import {Link} from 'react-router-dom'
import "./NavBar.css"
import { useNavigate } from 'react-router-dom'
import { LoggedInUser } from './LoggedInUser';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Cookies from "universal-cookie";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';


export default function NavBar(){
    const navigate = useNavigate();

    
    const handleLogOut = () => {
        navigate("/")
        localStorage.removeItem("token")
    }
    const {loggedInUser, setLoggedInUser, loggedIn, setLoggedIn, userGuideClicked, setUserGuideClicked, 
      navbarOpen, setNavbarOpen,showNavbarTitle, setShowNavbarTitle, narrowScreen, setNarrowScreen} = useContext(LoggedInUser);
    
    var userLoggedIn = null;

    if (localStorage.getItem("loggedIn") != null) {
        userLoggedIn = localStorage.getItem("loggedIn");
    } else {
        userLoggedIn = false;
    }

     function LogoutUser() {
        localStorage.removeItem("token")
        localStorage.removeItem('loggedIn')
        localStorage.removeItem("loggedInUser")
        const cookies = new Cookies()
        cookies.remove('userLogIn')

        navigate("/login", {replace: true})
        window.location.reload();
        
        
    }
    const [open, setOpen] = useState(false); 
      
    const handleClose = () => {
        setOpen(false); 
        LogoutUser()
    };
    
    const SessionTimeoutPopup = () => {
    
        return (
          <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
              style: {
                backgroundColor: '#f7f7f7',
                borderRadius: '5px', 
                minWidth: '200px', // Control size
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
              <Button onClick={handleClose} variant="contained" color="success">
                OK
              </Button>
            </DialogActions>
          </Dialog>
        );
      };

    function checkVital() {
        const cookie = new Cookies()
        if (cookie.get('userLogInCookie') == null) {
            // window.alert("Your session has been timed out, please log in to view the portal.");
            setOpen(true)
            
        }
    }
    
    const [clickedDashboard, setClickedDashboard] = useState(true);

    const toDashboardTab = () => {
        checkVital();
        setClickedDashboard(true);
        setClickedHistory(false);
        setUserGuideClicked(false);

    }

    const [clickedHistory, setClickedHistory] = useState(false);

    const toHistoryTab = () => {
        checkVital();
        setClickedHistory(true);
        setClickedDashboard(false);
        setUserGuideClicked(false);
    }

    
    return (
      <div>
        {navbarOpen && <div className={narrowScreen ? 'navbar-narrow' : 'navbar'}>
        
            {userLoggedIn && 
                <div className="navbar-links">
                    { showNavbarTitle && <div className="navbar-item"> 
                        <Link to="/dashboard" className={(clickedDashboard && !userGuideClicked )? "navbar-item-link-clicked" : "navbar-item-link"} onClick={toDashboardTab}> <HomeIcon className="navbar-icon"></HomeIcon>Dashboard</Link> 
                    </div>}

                    {!showNavbarTitle && <div className="navbar-item"> 
                        <Link to="/dashboard" className={(clickedDashboard && !userGuideClicked )? "navbar-item-link-clicked" : "navbar-item-link"} onClick={toDashboardTab}> <HomeIcon className="navbar-icon-in-narrow-mode"></HomeIcon></Link> 
                    </div>}
                
                     { showNavbarTitle && <div className="navbar-item">
                        <Link to="/history" className={(clickedHistory && !userGuideClicked )? "navbar-item-link-clicked" : "navbar-item-link"} onClick={toHistoryTab}> <CalendarMonthIcon className="navbar-icon"></CalendarMonthIcon>History</Link>
                    </div>}

                    { !showNavbarTitle && <div className="navbar-item">
                        <Link to="/history" className={(clickedHistory && !userGuideClicked )? "navbar-item-link-clicked" : "navbar-item-link"} onClick={toHistoryTab}> <CalendarMonthIcon className="navbar-icon-in-narrow-mode"></CalendarMonthIcon></Link>
                    </div>}
         
                </div> 
            }
           
            {open && SessionTimeoutPopup()}

        </div>}
      </div>
    )
}