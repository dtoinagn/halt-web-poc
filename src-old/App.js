import './App.css';
import React, { useState , useEffect, useContext} from 'react';
import { LoggedInUser } from './components/common/LoggedInUser';
import History from './components/dashboard/History';
import LogIn from './components/login/LogIn';
import {BrowserRouter, Route, Routes} from 'react-router-dom'

import { ColorModeContext, useMode } from './theme';
import { CssBaseline, ThemeProvider } from "@mui/material";
import Dashboard from './components/dashboard/Dashboard.js';
import NavBar from './components/common/NavBar.js';
import TopBar from './components/common/TopBar.js';
import NotLoggedIn from './components/dashboard/NotLoggedIn.js';
import AlreadyLoggedIn from './components/dashboard/AlreadyLoggedIn.js';
import Welcome from './components/dashboard/Welcome.js';
import WelcomeUser from './components/dashboard/WelcomeUser.js';
import UserGuide from './components/dashboard/UserGuide.js';
import { useNavigate } from 'react-router-dom'

import Cookies from "universal-cookie"


function App() {

  const [loggedInUser, setLoggedInUser] = useState('notLoggedIn')
  const [loggedIn, setLoggedIn] = useState(false)
  const [userGuideClicked, setUserGuideClicked] = useState(false)
  const [theme, colorMode] = useMode();
  const [isSideBar, setIsSideBar] = useState(true);
  const [navbarOpen, setNavbarOpen] = useState(true);
  const [showNavbarTitle, setShowNavbarTitle] = useState(true);
  const [narrowScreen, setNarrowScreen] = useState(false);
  const userLoggedIn = localStorage.getItem("loggedIn");

  const {apiRetrieveData} = window.runConfig;
  

  const value = {
    loggedInUser,
    setLoggedInUser,
    loggedIn,
    setLoggedIn,
    userGuideClicked,
    setUserGuideClicked,
    navbarOpen,
    setNavbarOpen,
    showNavbarTitle, 
    setShowNavbarTitle,
    narrowScreen, 
    setNarrowScreen
  }
  
  return (
    <>
        {/* <ColorModeContext.Provider value={colorMode}>  */}
          {/* <ThemeProvider theme={theme}> */}
          <BrowserRouter>
            <CssBaseline />
            <div className="app" style={{ height: '100vh', overflowY: 'hidden' }}>
           
              {/* <div className="main"> */}
                
                  <LoggedInUser.Provider value={value}>
                    <TopBar />
                    <NavBar />
                    <div className={(navbarOpen && narrowScreen)? "content-next-to-narrow-navbar" :  (navbarOpen && !narrowScreen) ? "content-next-to-default-navbar" : "content-full-width"}>
                    
                    {/* {!narrowScreen && <div> */}
                    <Routes>
              
                          {!userLoggedIn && <Route path='/login' element={<LogIn />} /> } 
                          {/* {userLoggedIn && <Route path='/login' element={<AlreadyLoggedIn />} />} */}


                          {!userLoggedIn && <Route path='/' element={<LogIn />} />}
                          {userLoggedIn && <Route path='/dashboard' element={<Dashboard />} />}

                          {/* {userLoggedIn && <Route path='/dashboard' element={<Dashboard />} /> } */}
                          {userLoggedIn && <Route path='/history' element={<History />} /> }
                          

                          {/* {!userLoggedIn && <Route path='/dashboard' element={<NotLoggedIn />} /> } */}
                          {!userLoggedIn && <Route path='/history' element={<NotLoggedIn />} /> }
                          <Route path='/userguide' element={<UserGuide />} />
                       
                    </Routes>
                    {/* </div>} */}
                    </div>
                  </LoggedInUser.Provider>
                
              {/* </div> */}
              
            </div>
          </BrowserRouter>
          {/* </ThemeProvider> */}
        {/* </ColorModeContext.Provider> */}
     
    </>
  );
}

export default App;
