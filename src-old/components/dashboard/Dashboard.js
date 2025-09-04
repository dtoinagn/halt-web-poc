import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Checkbox, Button, Typography, Link, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
  FormControlLabel, Snackbar, Alert, MenuItem, Grid,TableSortLabel,
  Select,FormControl, InputLabel
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import 'react-multi-carousel/lib/styles.css';
import 'reactjs-popup/dist/index.css';
import "./Dashboard.css";
import { useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';
import dayjs from 'dayjs';
import { create } from '@mui/material/styles/createTransitions';
import PendingTableTemplate from '../dashboard/DashboardTableTabDesign/PendingTable'
import ActiveSSCBTableTemplate from './DashboardTableTabDesign/ActiveSSCBTable';
import LiftedTableTemplate from './DashboardTableTabDesign/LiftedTable';
import CreateNewHaltModal from './createNewHalt';




export default function Dashboard() {

  const navigate = useNavigate();
  const user = localStorage.getItem("loggedInUser")
  const userLoggedIn = localStorage.getItem("loggedIn")
  const hideExtendCaption = "Hide Extended Halt"

  const [regTab, setRegTab] = useState(true);
  const [sscbTab, setSSCBTab] = useState(false);
  const [pendingTab, setPendingTab] = useState(false);
  const [liftedTab, setLiftedTab] = useState(false);

  const [innerHeight, setInnerHeight] = useState(0);
  const [innerWidth, setInnerWidth] = useState(0);
  let tableHeight = 0.5 * innerHeight;

  const [activeRegData, setActiveRegData] = useState([])
  const [activeSSCBData, setActiveSSCBData] = useState([])
  const [liftedData, setLiftedData] = useState([])
  const [pendingData, setPendingData] = useState([])
  const [haltList, setHaltList] = useState([])
  const [activeRegHaltList, setActiveHaltList] = useState([])
  const [notExtendedList, setNotExtendedList] = useState([])

  const {apiNewHalt} = window.runConfig;
  const [sseTicket, setSSEticket] = useState("");
  const [sseData, setSSEdata] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sseMessage, setSSEMessage] = useState('')
  const timeoutRef = useRef(null);
  const { apiSSEticket, apiSSEstream, notificationTimeout } = window.runConfig;


  const [newHaltModalOpen, setNewHaltModalOpen] = useState(false)
  const {apiFetchSecurities} = window.runConfig
  const [securities, setSecurities] = useState([])

  const {apiFetchHaltReasons} = window.runConfig
  const [haltReasons, setHaltReasons] = useState([])



  useEffect(() => {
    const updateParameters = () => {
      setInnerHeight(window.innerHeight);
      setInnerWidth(window.innerWidth)
    }

    window.addEventListener("resize", updateParameters);
    updateParameters();
  }, [])



 
  async function fetchActiveHalts() {
    const token = localStorage.getItem('token'); 
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  
    }
    
    try {
      const response = await fetch(`${apiRetrieveData}`, {
        method: 'GET',
        headers: header
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error ${response.status}: ${errorMessage}`);
      }

      console.log("this is active list response", response)
  
      const data = await response.json();
      console.log("debug active halt data", data)

      let tempActiveRegData = []
      let tempActiveSSCBData = []
      let tempLiftedData = []
      let tempPendingData = []
      let tempHaltList = []
      let tempActiveRegList = []
      let tempNotExtendedList = []

      for (const item in data){
        const haltId = data[item].haltId
        tempHaltList.push(haltId)

        console.log("debug this is item", data[item])


        const haltType = data[item].haltType
        const currTime = new Date()
        const haltStatus = data[item].status
        let resumptionTime = new Date(data[item].resumptionTime)
        let haltedSameDay = (currTime.getFullYear() === resumptionTime.getFullYear() &&
        currTime.getMonth() === resumptionTime.getMonth() &&
        currTime.getDate() === resumptionTime.getDate());
        const extendedStatus = data[item].extendedHalt;

        const haltTime = data[item].haltTime
        // const resumptionT = data[item].resumptionTime


        const haltTimeReformatted = haltTime.replace(/T/g,' ')
        data[item].haltTime = haltTimeReformatted
   

        if (data[item].resumptionTime != null) {
          const resumptionTimeReformatted = data[item].resumptionTime.replace(/T/g,' ')
          data[item].resumptionTime = resumptionTimeReformatted

          const original = dayjs(data[item].resumptionTime);
          const roundedUp = original.millisecond() > 0 ? original.add(1, 'second').startOf('second') : original;
          const roundedUpResumptionTime = roundedUp.format('YYYY-MM-DD HH:mm:ss.SSS')
          data[item].resumptionTime = roundedUpResumptionTime
        }

        if (data[item].haltTime != null && data[item].haltType === "REG") {
          const haltTimeReformatted = data[item].haltTime.replace(/T/g,' ')
          data[item].haltTime = haltTimeReformatted

          const original = dayjs(data[item].haltTime);
          const roundedUp = original.millisecond() > 0 ? original.add(1, 'second').startOf('second') : original;
          const roundedUpHaltTime = roundedUp.format('YYYY-MM-DD HH:mm:ss.SSS')
          data[item].haltTime = roundedUpHaltTime
        }

        if (typeof data[item].issueName === 'string' && data[item].issueName.length > 25) {
          data[item].issueName = data[item].issueName.slice(0,25)
        }
       
        if (haltStatus === "Resumed" && haltedSameDay) {
          tempLiftedData.push(data[item])
        } else if (((haltStatus === "Halted") || (haltStatus === "ResumptionPending")) && haltType === "REG") {
          tempActiveRegData.push(data[item])
          tempActiveRegList.push(haltId)
        } else if ((haltStatus === "ResumptionPending" || haltStatus === "Halted") && haltType === "SSCB") {
          tempActiveSSCBData.push(data[item])
        } else if (haltStatus === "HaltPending") {
          tempPendingData.push(data[item])
        }


        if (extendedStatus === false && haltType === "REG" && (haltStatus === "Halted" || haltStatus === "ResumptionPending")) {
          tempNotExtendedList.push(haltId)
        }
      }
      setHaltList(tempHaltList)
      setActiveHaltList(tempActiveRegList)
      setActiveRegData(tempActiveRegData)
      setPendingData(tempPendingData)
      setLiftedData(tempLiftedData)
      setActiveSSCBData(tempActiveSSCBData)
      setNotExtendedList(tempNotExtendedList)
      console.log("dashboard mounted")
    
    } catch (error) {
      console.error('Failed to fetch active halts:', error);
    }
  }

  async function getSSEticket() {
    try {
      const header = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(apiSSEticket, {
        method: 'POST',
        headers: header
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`SSE Ticket Error ${response.status}: ${errorMessage}`);
      }

      const data = await response.json();
      const ticket = data.sseTicket;
      setSSEticket(ticket); 
      console.log("Got SSE ticket:", ticket);
    } catch (err) {
      console.error("Failed to get SSE ticket:", err);
    }
    console.log("sse ticket retrieval")
  }


  async function fetchSecurities() {
    const token = localStorage.getItem('token'); 
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  
    }
    
    try {
      const response = await fetch(`${apiFetchSecurities}`, {
        method: 'GET',
        headers: header
      });



      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error fetching securities, CreateNewHaltModal ${response.status}: ${errorMessage}`);
      }
  
      const data = await response.json();

      let tempSecurities = []
      for (const item of data) {
        tempSecurities.push(item)
      }
      setSecurities(tempSecurities)
    
    } catch (error) {
      console.error('Failed to fetch securities:', error);
    }
  }

  async function fetchHaltReasons() {
    const token = localStorage.getItem('token'); 
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  
    }
    
    try {
      const response = await fetch(`${apiFetchHaltReasons}`, {
        method: 'GET',
        headers: header
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error fetching halt reasons, CreateNewHaltModal ${response.status}: ${errorMessage}`);
      }
  
      const data = await response.json();

      let tempHaltReasons = []
      for (const item of data) {
        tempHaltReasons.push(item)
      }

      setHaltReasons(tempHaltReasons)    
    } catch (error) {
      console.error('Failed to fetch halt reasons:', error);
    }
  }

   function initializeSortPreferences() {
    const defaults = {
      activeRegOrderedBy: 'haltTime',
      activeRegOrderDirection: 'desc',
      activeSSCBOrderedBy: 'haltTime',
      activeSSCBOrderDirection: 'desc',
      pendingOrderedBy: 'haltTime',
      pendingOrderDirection: 'desc',
      todayLiftedOrderedBy: 'haltTime',
      todayLiftedOrderDirection: 'desc'
    };

    for (const key in defaults) {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, defaults[key]);
      }
    }
  }
  
  useEffect(() => {
    fetchActiveHalts();
    getSSEticket(); 
    fetchSecurities();
    fetchHaltReasons();
    initializeSortPreferences();

  },[]);


  const selectRegTab = () => {
      setRegTab(true);
      setSSCBTab(false);
      setPendingTab(false);
      setLiftedTab(false);
  }

  const selectSSCBTab = () => {
      setRegTab(false);
      setSSCBTab(true);
      setPendingTab(false);
      setLiftedTab(false);
  }

  const selectPendingTab = () => {
      setRegTab(false);
      setSSCBTab(false);
      setPendingTab(true);
      setLiftedTab(false);
  }

  const selectLiftedTab = () => {
      setRegTab(false);
      setSSCBTab(false);
      setPendingTab(false);
      setLiftedTab(true);
  }


  const {apiRetrieveData} = window.runConfig;
  const token = localStorage.getItem('token');


  const [activeRegOrder, setActiveRegOrder] = useState('asc');
  const [activeRegOrderBy, setActiveRegOrderBy] = useState('createdBy');

  const [confirmDialog, setConfirmDialog] = useState({
      open: false,
      rowIndex: null,
      newValue: null,
      haltId: null,
    });
  const browserCookies = new Cookies()
  const browserCookieHideExtend = browserCookies.get('userHideExtendedHalt')

  const [hideExtended, setHideExtended] = useState(browserCookieHideExtend);

  

const handleClose = () => {
  setOpen(false);
  clearTimeout(timeoutRef.current);
};


// const ticketRequested = useRef(false);


useEffect(() => {
  if (!sseTicket) return;

  const source1 = new EventSource(`${apiSSEstream}${sseTicket}`, {
    withCredentials: false,
  });

  console.log("sse connected")

  source1.onmessage = (event) => {
    const dataObj = JSON.parse(event.data);

    if (dataObj.heartbeat) {
      console.log("this is a heartbeat", dataObj);
      setSSEdata(event.data)
    } else {
      setSSEdata(event.data);
      // setMessage(event.data); 
      setSSEMessage(event.data);
      
      setOpen(true);
      console.log("this is a sse message", dataObj);

      const sseBody = JSON.parse(event.data)

      const haltStatus = sseBody.status
      const haltId = sseBody.haltId
      const haltTime = sseBody.haltTime
      const resumptionTime = sseBody.resumptionTime
      const haltType = sseBody.haltType
      const extendedStatus = sseBody.extendedHalt
      const symbol = sseBody.symbol
      let answer = 0

      sseBody.haltTime = haltTime.replace(/T/g,' ')

      if (resumptionTime != null) {
        sseBody.resumptionTime = resumptionTime.replace(/T/g,' ')
      }


      if (haltList.includes(haltId)) {
        const prev = activeRegData.find(obj => obj.haltId == haltId)

        if (activeRegHaltList.includes(haltId) && extendedStatus != prev.extendedHalt && (haltStatus == "ResumptionPending" || haltStatus == "Halted")) {
            let tempNotExtend = []
            if (extendedStatus) {
              tempNotExtend = notExtendedList.filter(obj => obj != haltId)
              var notification = `Halt has been marked as extended for ${symbol}`
              setMessage(notification)
            } else {
              tempNotExtend = notExtendedList
              tempNotExtend.push(haltId)
              var notification = `Halt has been marked as non-extended for ${symbol}`
              setMessage(notification)
            }

            setNotExtendedList(tempNotExtend)
            let tempActiveReg = activeRegData.filter(obj => obj.haltId != haltId)
            tempActiveReg.push(sseBody)
            setActiveRegData(tempActiveReg)
              
    
        } else if (haltStatus === "Resumed" && haltType === "REG") {
          let newActive = activeRegData.filter(obj => obj.haltId != haltId)
          setActiveRegData(newActive)

          if (!resumptionTime) {
            const now = new Date();

            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0'); 
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            sseBody.resumptionTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
          }

          let tempLifted = liftedData
          tempLifted.push(sseBody)
          setLiftedData(tempLifted)
          var notification = `Halt has been resumed for ${symbol}`
          setMessage(notification)
         
          let tempActiveRegHaltList = activeRegHaltList.filter(obj => obj.haltId != haltId)
          setActiveHaltList(tempActiveRegHaltList)
        } else if (haltStatus === "Resumed" && haltType === "SSCB") {
          let newSSCB = activeSSCBData.filter(obj => obj.haltId != haltId)
          setActiveSSCBData(newSSCB)
          let tempLifted = liftedData
          tempLifted.push(sseBody)
          setLiftedData(tempLifted)
          var notification = `Halt has been resumed for ${symbol}`
          setMessage(notification)
         
        } else if (activeRegHaltList.includes(haltId) && haltStatus === "ResumptionPending" && haltType === "REG") {
          //in this case, when we receive a sse message, the halt is already an active reg halt but it doesn't have a resumption time
          //this sse message is to set the resumption time only, without adding a new halt into the active halt tab 

          let tempActiveReg = activeRegData.filter(obj => obj.haltId != haltId)
          tempActiveReg.push(sseBody)
          setActiveRegData(tempActiveReg)

          var notification = `Resumption time has been set for ${symbol}`
          setMessage(notification)
          

        } else if ((haltStatus === "Halted") && haltType === "REG" && extendedStatus == prev.extendedHalt) {
          let newPending = pendingData.filter(obj => obj.haltId != haltId)
          setPendingData(newPending)
          let tempActiveReg = activeRegData
          tempActiveReg.push(sseBody)
          setActiveRegData(tempActiveReg)
          var notification = `Halt is now active for ${symbol}`
          setMessage(notification)

          if (notExtendedList.includes(haltId) && extendedStatus == true) {
            let tempActiveReg = activeRegData.filter(obj => obj.haltId != haltId)
            tempActiveReg.push(sseBody)
            setActiveRegData(tempActiveReg)

            let tempNotExtend = notExtendedList.filter(obj => obj!= haltId)
            
            var notification = `Halt has been marked as extended for ${symbol}`
            setMessage(notification)
          }
        }

      } else {
        if (haltStatus === "Halted" && haltType === "REG") {
          let tempActiveReg = activeRegData
          tempActiveReg.push(sseBody)
          setActiveRegData(tempActiveReg)
          var notification = `New regulatory halt has been created for ${symbol}`
          setMessage(notification)
          let tempActiveList = activeRegHaltList
          tempActiveList.push(haltId)
          setActiveHaltList(tempActiveList)
        } else if (haltStatus === "ResumptionPending"  && haltType === "SSCB") {
          let tempActiveSSCB = activeSSCBData
          tempActiveSSCB.push(sseBody)
          setActiveSSCBData(tempActiveSSCB)
          var notification = `New SSCB halt has been created for ${symbol}`
          setMessage(notification)
        } else if (haltStatus === "HaltPending") {
          let tempPending = pendingData
          tempPending.push(sseBody)
          setPendingData(tempPending)
          var notification = `New regulatory halt has been scheduled for ${symbol}`
          setMessage(notification)
        }
      }

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setOpen(false), notificationTimeout);
    }
  };

  source1.onerror = (err) => {
    console.error("SSE error:", err);
    source1.close();
  };

  return () => {
    source1.close();
    clearTimeout(timeoutRef.current);
  };
},[sseTicket]); 

///////////////////////////////////////////////////////////////////////////////////////////////////////

let mainTabHeight = 0.11 * innerHeight;
let tabFontSize = 2 * innerHeight / 100;

function handleNewHaltModalOpen() {
    setNewHaltModalOpen(true)
}

function TableMainTabs() {
            
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
        height={mainTabHeight}
        width="95%"
        padding={1}
        marginTop={3}
        fontWeight={"bold"}
        flex={1} 
        
      >   
        
        <Box 
          onClick={selectRegTab} 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          flex={1} 
          marginLeft={1} 
          bgcolor={regTab ?"#6d8b89" : "#b7c6c6"} 
          height="100%"
          color="white"
          fontSize="1rem + {tabFontSize}"
        > 
            Active Reg Halt
          <button className="tab-num">{activeRegData.length}</button>
        </Box>
        <Box 
            onClick={selectSSCBTab} 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            flex={1} 
            marginLeft={0.4} 
            bgcolor={sscbTab ? "#6d8b89" : "#b7c6c6"} 
            height="100%"
            color="white"
            fontSize={16}
        > 
            Active SSCB Halt
            <button className="tab-num">{activeSSCBData.length}</button>
        </Box>
        <Box 
            onClick={selectPendingTab} 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            flex={1} 
            marginLeft={0.4} 
            bgcolor={pendingTab ?"#6d8b89" : "#b7c6c6"} 
            height="100%"
            color="white"
            fontSize={16}
        > 
            Scheduled Halts
            <button className="tab-num">{pendingData.length}</button>
        </Box>
        <Box 
            onClick={selectLiftedTab} 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            flex={1} 
            marginLeft={0.4} 
            bgcolor={liftedTab ? "#6d8b89" : "#b7c6c6"} 
            textDecoration={liftedTab ? "underline" : "none"}
            height="100%"
            color="white"
            fontSize={16}
        > 
            Today Lifted Halt
            <button className="tab-num">{liftedData.length}</button>
        </Box>
        <button className="newhalt-button" onClick={handleNewHaltModalOpen}>  Create new halts </button>
    </Box>
    )
  }



  //////////////////////////////////////////////////////////////////////////////////////////////

  function ActiveRegTableTemplateNew() {

  const tableHeader = [
    'Halt ID', 'Symbol', 'Issue Name', 'Listing Market',
    'All Issues', 'Created By', 'Halt Time', 'Resumption Time',
    'Extended Halt', ' ', '   '
  ];


  const { apiUpdateExtendedHaltState } = window.runConfig;

  //
  const [hideExtended, setHideExtended] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false, rowIndex: null, newValue: null, haltId: null
  });

  // table sorting 

  const keyMap = {
    "Halt ID": "haltId",
    "Symbol": "symbol",
    "Issue Name": "issueName",
    "Listing Market": "listingMarket",
    "All Issues": "allIssue",
    "Created By": "createdBy",
    "Halt Time": "haltTime",
    "Resumption Time": "resumptionTime",
    "Extended Halt": "extendedHalt"
  };
  const defaultOrderBy = localStorage.getItem("activeRegOrderedBy") || "haltTime";
  const defaultOrderDirection = localStorage.getItem("activeRegOrderDirection") || "desc";

  const [orderBy, setOrderBy] = useState(defaultOrderBy);
  const [orderDirection, setOrderDirection] = useState(defaultOrderDirection);
   const visibleRows = hideExtended
    ? activeRegData.filter(row => !row.extendedHalt)
    : activeRegData;

  const handleSortRequest = (columnKey) => {
    const isAsc = orderBy === columnKey && orderDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setOrderBy(columnKey);
    setOrderDirection(newDirection);
    localStorage.setItem("activeRegOrderedBy", columnKey);
    localStorage.setItem("activeRegOrderDirection", newDirection);
  };

  const sortRows = (rows) => {
    return [...rows].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];

      const isDate = val => typeof val === "string" && /\d{4}-\d{2}-\d{2}T/.test(val);
      if (isDate(aVal)) aVal = new Date(aVal);
      if (isDate(bVal)) bVal = new Date(bVal);

      if (aVal < bVal) return orderDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return orderDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedRows = sortRows(visibleRows);

  ///////////////////////////////////////////////////////////////////////////////////////
  //sending out new immediate halt 

  const formatDateTime = (isoString) => {
    if (!isoString) return null;
    try {
      return new Date(isoString).toISOString();
    } catch {
      return isoString;
    }
  };

  const buildHaltPayload = (targetHaltId) => {
    const timeKeys = ['haltTime', 'resumptionTime', 'cancelTime', 'createdTime', 'modifiedTime'];

    let row = activeRegData.find(obj => obj.haltId === targetHaltId)

    const payload = {
      "haltId": row.haltId,
      "symbol": row.symbol || '',
      "issueName": row.issueName || '',
      "listingMarket": row.listingMarket || '',
      "allIssue": row.allIssue || '',
      "haltTime": '',
      "resumptionTime": '',
      "cancelTime": '',
      "extendedHalt": row.extendedHalt,
      "haltReason": row.haltReason || '',
      "remainReason": row.remainReason || '',
      "status": row.status || '',
      "haltType": row.haltType || '',
      "createdBy": row.createdBy || '',
      "createdTime": '',
      "modifiedBy": row.modifiedBy || '',
      "modifiedTime": '',
      "sscbSrc": row.sscbSrc || '',
      "responseMessage": row.responseMessage || '',
      "id": row.id || ''
    };

    // timeKeys.forEach(key => {
    //   if (payload[key]) payload[key] = formatDateTime(payload[key]);
    // });

    return payload;
  };

  const handleExtendHalt = (row, index) => () => {
    setConfirmDialog({
      open: true,
      rowIndex: index,
      newValue: !row.extendedHalt,
      haltId: row.haltId
    });
  };

  const handleDialogClose = async (confirm) => {

    console.log("debug extend", confirmDialog.rowIndex, confirmDialog.newValue, confirmDialog.haltId)
    if (confirm && confirmDialog.rowIndex !== null) {

      let prev = activeRegData.find(obj => obj.haltId == confirmDialog.haltId)
      prev.extendedHalt = !prev.extendedHalt
      console.log("debug PREV", prev)
      // ////
      // const updatedData = [...activeRegData];
      // const updatedRow = {
      //   ...updatedData[confirmDialog.rowIndex],
      //   extendedHalt: confirmDialog.newValue
      // };
      // updatedData[confirmDialog.rowIndex] = updatedRow;
      ///
      let tempActiveReg = activeRegData.filter(obj => obj.haltId != confirmDialog.haltId)
      tempActiveReg.push(prev)
      setActiveRegData(tempActiveReg);

      const payload = buildHaltPayload(confirmDialog.haltId);
      const authToken = localStorage.getItem("token");
      console.log("Payload sent to /api/halt/update-extended", payload);


      try {
        const response = await fetch(apiUpdateExtendedHaltState, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        if (response.ok) {
          console.log("extend is ok")
        }
      } catch (error) {
        console.error("Error sending extend update:", error);
      }
    }

    setConfirmDialog({
      open: false,
      rowIndex: null,
      newValue: null,
      haltId: null
    });
  };

  const toggleHideExtended = () => {
    browserCookies.set('userHideExtendedHalt', !hideExtended);
    setHideExtended(!hideExtended);
  };



  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 3,
          mt: 5,
          mr: 2,
          flexWrap: 'wrap', 
        }}
      >

        <Box sx={{ display: 'flex', gap: 3 }}>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={orderBy}
              label="Sort By"
              onChange={(e) => {
                const val = e.target.value;
                setOrderBy(val);
                localStorage.setItem("activeRegOrderedBy", val);
              }}
            >
              {Object.entries(keyMap).map(([label, value]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={orderDirection}
              label="Direction"
              onChange={(e) => {
                const val = e.target.value;
                setOrderDirection(val);
                localStorage.setItem("activeRegOrderDirection", val);
              }}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>

        
          <FormControlLabel 
            control={
              <Checkbox
                checked={hideExtended}
                onChange={toggleHideExtended}
                color="default"
              />
            }
            label="Hide extended halt"
            sx={{ m: 0 }} 
          />
          {hideExtended ? <button className="hidden-halt-num">{activeRegHaltList.length - notExtendedList.length}</button> : ""}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#7d9c9c', marginTop: 2, maxHeight: 400 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#006666' }}>
              {tableHeader.map((head, idx) => (
                <TableCell key={idx} sx={{
                  color: 'white', fontWeight: 'bold', position: 'sticky',
                  top: 0, zIndex: 1, backgroundColor: '#006666'
                }}>
                  {keyMap[head] ? (
                    <TableSortLabel
                      active={orderBy === keyMap[head]}
                      direction={orderBy === keyMap[head] ? orderDirection : 'asc'}
                      onClick={() => handleSortRequest(keyMap[head])}
                      sx={{ color: 'white' }}
                    >
                      {head}
                    </TableSortLabel>
                  ) : head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, idx) => (
              <TableRow key={idx} sx={{ backgroundColor: 'white' }}>
                <TableCell>{row.haltId}</TableCell>
                <TableCell>{row.symbol}</TableCell>
                <TableCell>{row.issueName}</TableCell>
                <TableCell>{row.listingMarket}</TableCell>
                <TableCell>{row.allIssue}</TableCell>
                <TableCell>{row.createdBy}</TableCell>
                <TableCell>{row.haltTime}</TableCell>
                <TableCell>{row.resumptionTime}</TableCell>
                <TableCell>
                  <Checkbox checked={row.extendedHalt} onChange={handleExtendHalt(row, idx)} />
                </TableCell>
                <TableCell><button>Resume Trading</button></TableCell>
                <TableCell>
                  {row.resumptionTime ? <button>Cancel Resumption</button> : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmDialog.open} onClose={() => handleDialogClose(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          {confirmDialog.newValue
            ? <>Are you sure you want to <strong>extend</strong> this halt with halt ID <strong>{confirmDialog.haltId}</strong>?</>
            : <>Are you sure you want to <strong>cancel the extend</strong> of this halt with halt ID <strong>{confirmDialog.haltId}</strong>?</>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)} color="error">No</Button>
          <Button onClick={() => handleDialogClose(true)} color="primary" autoFocus>Yes</Button>
        </DialogActions>
      </Dialog>
    </div>
  )}

  return (
      <div>
          <div>
            {/* {innerHeight}
            {innerWidth} */}
            {/* {sseMessage} */}
            {TableMainTabs()}
            <CreateNewHaltModal 
              open={newHaltModalOpen} 
              onClose={() => setNewHaltModalOpen(false)} 
              onSubmit={() => {}} 
              securities={securities} 
              haltReasons={haltReasons} 
            />
            
            <Box 
              height="100%"
              width="98%"
              bgcolor={"#6d8b89"}
              marginTop={-0.9}
              marginLeft={2}
              marginRight={1}
              padding={1}
              flex={1} 
            >
             {regTab && <ActiveRegTableTemplateNew />}
            {sscbTab && <ActiveSSCBTableTemplate activeSSCBData={activeSSCBData}/>}
            {pendingTab && <PendingTableTemplate pendingData={pendingData}/>} 
            {liftedTab && <LiftedTableTemplate liftedData={liftedData} />} 

               <Snackbar
                open={open}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                onClose={handleClose}
                autoHideDuration={notificationTimeout}
              >
                <Alert onClose={handleClose} severity="info" sx={{ width: '100%', marginTop: 1}} variant="filled">
                  {message}
                </Alert>
              </Snackbar>
            </Box>
          </div>  
      </div>
  
  )

}