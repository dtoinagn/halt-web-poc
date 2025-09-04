import React, { useState , useEffect, useContext} from 'react';
import 'react-multi-carousel/lib/styles.css';
import 'reactjs-popup/dist/index.css';
import NavBar from '../common/NavBar'
import { LoggedInUser } from '../common/LoggedInUser';




export default function History() {
    // const {loggedInUser, setLoggedInUser} = useContext(LoggedInUser);
   

    return (
        <div className="dashboard">
            {/* <NavBar className='dashboard-column-1'/> */}

            <div className='dashboard-column-2'> 
                <div className="dashboard-header"> This is the history tab </div>
            </div>
        </div>
    )
}

