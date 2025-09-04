import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { LoggedInUserContext } from "./contexts/LoggedInUserContext";
import { authUtils } from "./utils/storageUtils";
import { ROUTE_PATHS } from "./constants";

// Components
import TopBar from "./components/common/TopBar";
import NavBar from "./components/common/NavBar";
import Dashboard from "./components/dashboard/Dashboard";
import History from "./components/dashboard/History";
import Login from "./components/login/Login";
import NotLoggedIn from "./components/dashboard/NotLoggedIn";
import UserGuide from "./components/dashboard/UserGuide";

function App() {
  const [loggedInUser, setLoggedInUser] = useState("notLoggedIn");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userGuideClicked, setUserGuideClicked] = useState(false);
  const [theme, colorMode] = useMode();
  const [navbarOpen, setNavbarOpen] = useState(true);
  const [showNavbarTitle, setShowNavbarTitle] = useState(true);
  const [narrowScreen, setNarrowScreen] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    const isUserLoggedIn = authUtils.isLoggedIn();
    const currentUser = authUtils.getLoggedInUser();

    setLoggedIn(isUserLoggedIn);
    if (currentUser && currentUser !== "notLoggedIn") {
      setLoggedInUser(currentUser);
    }
  }, []);

  const contextValue = {
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
    setNarrowScreen,
  };

  const userLoggedIn = authUtils.isLoggedIn();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CssBaseline />
          <div className="app" style={{ height: "100vh", overflowY: "hidden" }}>
            <LoggedInUserContext.Provider value={contextValue}>
              <TopBar />
              <NavBar />
              <div
                className={
                  navbarOpen && narrowScreen
                    ? "content-next-to-narrow-navbar"
                    : navbarOpen && !narrowScreen
                      ? "content-next-to-default-navbar"
                      : "content-full-width"
                }
              >
                <Routes>
                  {/* Authentication routes */}
                  {!userLoggedIn && (
                    <Route path={ROUTE_PATHS.LOGIN} element={<Login />} />
                  )}
                  {!userLoggedIn && (
                    <Route path={ROUTE_PATHS.ROOT} element={<Login />} />
                  )}

                  {/* Protected routes */}
                  {userLoggedIn && (
                    <Route
                      path={ROUTE_PATHS.DASHBOARD}
                      element={<Dashboard />}
                    />
                  )}
                  {userLoggedIn && (
                    <Route path={ROUTE_PATHS.HISTORY} element={<History />} />
                  )}

                  {/* Restricted routes for non-authenticated users */}
                  {!userLoggedIn && (
                    <Route
                      path={ROUTE_PATHS.HISTORY}
                      element={<NotLoggedIn />}
                    />
                  )}

                  {/* Public routes */}
                  <Route
                    path={ROUTE_PATHS.USER_GUIDE}
                    element={<UserGuide />}
                  />
                </Routes>
              </div>
            </LoggedInUserContext.Provider>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
