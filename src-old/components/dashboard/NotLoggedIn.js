import React, { useState , useEffect, useContext} from 'react';
import 'react-multi-carousel/lib/styles.css';
import 'reactjs-popup/dist/index.css';


export default function NotLoggedIn() {
    return (
        <div className="dashboard">
            <div className="dashboard-header"> Please log in to view the portal </div>
        </div>
    )
}

