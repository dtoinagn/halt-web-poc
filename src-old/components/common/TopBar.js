import React, {useState, useContext, useEffect, useRef} from 'react';
import "./TopBar.css"
import Logo from "./logo.png"
import { useNavigate } from 'react-router-dom'
import { LoggedInUser } from './LoggedInUser';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import Cookies from "universal-cookie"
import HelpIcon from '@mui/icons-material/Help';
import MenuIcon from '@mui/icons-material/Menu';



export default function TopBar() {
    const navigate = useNavigate();
    const {loggedInUser, setLoggedInUser, loggedIn, setLoggedIn, navbarOpen, setNavbarOpen,
        showNavbarTitle, setShowNavbarTitle, narrowScreen, setNarrowScreen} = useContext(LoggedInUser);

    // var userLoggedIn = false;
    // var user = null;
    // var initial = null;
    // var init = "00";
    
    // if (localStorage.getItem("token") == true) {
    //     userLoggedIn = localStorage.getItem("loggedIn");
    //     user = localStorage.getItem("loggedInUser");
    //     initial = user[0] + user[1];
    //     init = initial.toUpperCase();
    // } 

    var userLoggedIn = null;
    var user = null;
    var inital = null;
    var init = null;

    const [innerHeight, setInnerHeight] = useState(0);
    const [innerWidth, setInnerWidth] = useState(0);
    const [showTitle, setShowTitle] = useState(false);
    let tableHeight = 0.5 * innerHeight;

    useEffect(() => {

    const updateParameters = () => {
        setInnerHeight(window.innerHeight);
        setInnerWidth(window.innerWidth)
        if (window.innerWidth < 1700) {
            // if (navbarOpen) {
            //     setNavbarOpen(false);
            // }
            
            setShowNavbarTitle(false);
            setNarrowScreen(true);
            
        } else {
            // setNavbarOpen(true);
            setShowTitle(true);
            setShowNavbarTitle(true);
            setNarrowScreen(false);
            
        }

        if (window.innerWidth < 980) {
            setShowTitle(false);
        } else {
            setShowTitle(true);
        }

        // if (window.innerWidth < 1200) {
        //     setNarrowScreen(true)
        // } else {
        //     setNarrowScreen(false)
        // }

      
    }

    window.addEventListener("resize", updateParameters);
    updateParameters();
    
    }, [])


    if (localStorage.getItem("loggedIn") != null) {
        userLoggedIn = localStorage.getItem("loggedIn");
    } else {
        userLoggedIn = false;
    }

    if (localStorage.getItem("loggedInUser") != null) {
        user = localStorage.getItem("loggedInUser");
    }
    
    
    if (user != null) {
        inital = user[0] + user[1];
        init = inital.toUpperCase();
    }
   
    function LogoutUser() {
        // setLoggedIn(false)
        localStorage.removeItem("token")
        localStorage.removeItem('loggedIn')
        localStorage.removeItem("loggedInUser")
        const cookies = new Cookies()
        cookies.remove('userLogIn')
        navigate("/", {replace: true})
        window.location.reload();
        
    }

    const {userGuideClicked, setUserGuideClicked} = useContext(LoggedInUser);

    function UserGuide() {
        setUserGuideClicked(true);
        navigate("/userguide")
    }
    
    const { closingHour, openingHour, inactivityLimitMinute } = window.runConfig;
    
    const isAfterHours = () => {
        const now = new Date();
        const hour = now.getHours();
  
        return hour >= closingHour || hour < openingHour; 
    };

    const inactivityTimeoutRef = useRef(null);

    const resetInactivityTimer = () => {
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
    
        if (isAfterHours()) {
          inactivityTimeoutRef.current = setTimeout(LogoutUser, inactivityLimitMinute * 60 * 1000); // 15 minutes
        }
    };

    const events = ['mousemove', 'keydown', 'click'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer(); // Initialize on mount


    useEffect(() => {
        // Handle logout at exactly 5 PM
        const checkTimeInterval = setInterval(() => {
          const now = new Date();
          if (now.getHours() === closingHour && now.getMinutes() === 0) {
            LogoutUser();
          }
        }, 1000 * 10); //check every 10 seconds 
    })


    function handleMenu() {
        setNavbarOpen(!navbarOpen)
    }

    return (

        <div className="topbar">
            <MenuIcon onClick={handleMenu} className="topbar-menubutton" fontSize="large"/>
            
            <img className="topbar-ciro-logo" src={Logo} alt="ciro company logo"/>
            {showTitle && <div className="topbar-header">CIRO Equity Trading Halt Management Portal </div>}
            
            {userLoggedIn && showTitle && <HelpIcon onClick={UserGuide} className="topbar-guide" fontSize="large"></HelpIcon>}
            {userLoggedIn && showTitle && <LogoutIcon onClick={LogoutUser} className="topbar-logoutbutton" fontSize="large"></LogoutIcon>}
            {/* {!userLoggedIn && <LoginIcon onClick={LoginUser} className="topbar-logoutbutton" fontSize="large"></LoginIcon>} */}


            {userLoggedIn && showTitle && <div className="topbar-profilepic">{init}</div>}
            
        </div>
       
    )
}