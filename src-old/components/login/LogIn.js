import { CompressOutlined } from '@mui/icons-material';
import React, {useState, useContext} from 'react';
import { useNavigate } from 'react-router-dom'
import CountdownTimer from '../dashboard/CountdownTimer';
import  { Redirect } from 'react-router-dom'
import './Login.css';
import { LoggedInUser } from '../common/LoggedInUser';
import TopBar from '../common/TopBar';
import Cookies from "universal-cookie"

export default function LogIn() {

    // const [user, setUser] = useState('')
    // const [tradeList, setTradeList] = useState([])
    const [password, setPassword] = useState('')
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [message, setMessage] = useState('')
    const [currUser, setCurrUser] = useState('')
    const [currTradeList, setCurrTradeList] = useState('')
    const {loggedInUser, setLoggedInUser, loggedIn, setLoggedIn} = useContext(LoggedInUser);
    const { apiUserLogIn, userLogInCookieExpirationMinute } = window.runConfig;


    const handleSetUser = (event) => {
        setCurrUser(event.target.value);
    };

    const handleSetPassword = (event) => {
        setPassword(event.target.value);
    };

    // const navigate = useNavigate()
    // const [accessToken, setAccessToken] = useState('')
    // const [refreshToken, setRefreshToken] = useState('')

    const navigate = useNavigate();
    // const [user, setUser] = useState();


    function handleLogIn(response) {
        if (response.status == "SUCCESS") {   
            setLoggedInUser(response.username)
            setLoggedIn(true)
            
            localStorage.setItem('token', response.jwt)
            localStorage.setItem('loggedIn', true)
            localStorage.setItem("loggedInUser", response.username)
            navigate("/dashboard", {replace:true});


            
            const cookie = new Cookies()
            
           
            cookie.set('userLogInCookie', response.username, {
                expires: new Date(Date.now() + userLogInCookieExpirationMinute * 60 * 1000)
            
            })

            // var date = new Date()
            // var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
            //     date.getUTCDate(), date.getUTCHours(),
            //     date.getUTCMinutes(), date.getUTCSeconds());

            // cookie.set('userLogIn', response.username, {
            //     expires: new Date(now_utc + tokenExpirationMinute * 60 * 1000)
            
            // })
    

            
            
        } else if (response.status == "FAIL") {
            if (response.httpStatus == "UNAUTHORIZED") {
                setMessage("Login Failed. The username or password you entered is incorrect. Please try again or contact support team for assistance.");
            } else if (response.httpStatus == "FORBIDDEN") {
                setMessage("Access Denied. Please contact the Support Team for access.");
            } else if (response.httpStatus == "INTERNAL_SERVER_ERROR") {
                setMessage("Connection lost. Please contact the Support Team for further assistance.");
            }
            
        }
    }


    function handleSubmit(event) {
        event.preventDefault();

        const request = {
            "username": event.target[0].value,
            "password": event.target[1].value
        };

        async function postData() {
            // const result = await fetch('http://stg-01-qa:8081/auth/login', {
            const result = await fetch(`${apiUserLogIn}`, {


            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
            })
           
            .then((response) => response.json())
            .then((data) => handleLogIn(data))
            .catch(err => console.log("this is ERROR:", err));
        }
        postData();
      
    }

    // function getData(event) {
    //     event.preventDefault();

    //     // const request = {
    //     //     "token"
    //     // }
    // }

    const [pswVisible, setPswVisible] = useState(false)
    function handleChangeVisibility() {
        setPswVisible(!pswVisible)
    }

    return (
        <div>
                <div className='login-errormsg'>{message}</div>
                <div className="login">
                <form onSubmit={handleSubmit}>
                    <div className="login-header">
                        <h2>Login</h2>
                    </div>
        
                    <div className="login-body">
                        <div className="login-debug">
                            <div>
                                <label className="login-input-header">User ID:</label>
                                <input
                                    className="login-input"
                                    value={currUser}
                                    placeholder="Username"
                                    onChange={handleSetUser}
                                />
                            </div>
                          
                        
                            <div>
                                <label className="login-input-header">Password:</label>
                                <input
                                    className="login-input"
                                    value={password}
                                    type="password" 
                                    placeholder="Password"
                                    onChange={handleSetPassword}
                                
                                />
                            </div>
                        {/* <br /> */}
                        </div>
                        <div>
                            <input
                                className="login-submit"
                                type="submit"
                                name="login"
                                />
                        </div>
                        
                    </div>
                </form>
          
            
                </div>
        </div>
    );
}



