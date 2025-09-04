import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import './Dashboard.css';
import { useHaltData } from '../../hooks/useHaltData';
import { useSSE } from '../../hooks/useSSE';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import Notification from '../ui/Notification';
import DashboardTabs from './components/DashboardTabs';
import ActiveRegTable from './components/ActiveRegTable';
import ActiveSSCBTable from './components/ActiveSSCBTable';
import PendingTable from './components/PendingTable';
import LiftedTable from './components/LiftedTable';
import CreateNewHaltModal from './components/CreateNewHaltModal';

const Dashboard = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('reg');
  const [newHaltModalOpen, setNewHaltModalOpen] = useState(false);

  // Window dimensions for responsive design
  const [windowDimensions, setWindowDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth
  });

  // Custom hooks
  const {
    activeRegData,
    activeSSCBData,
    liftedData,
    pendingData,
    haltList,
    activeRegHaltList,
    notExtendedList,
    securities,
    haltReasons,
    loading,
    error,
    fetchActiveHalts,
    updateExtendedHaltState,
    setActiveRegData,
    setActiveSSCBData,
    setLiftedData,
    setPendingData,
    setActiveRegHaltList,
    setNotExtendedList
  } = useHaltData();

  const {
    getSSETicket,
    notification,
    showNotification,
    hideNotification
  } = useSSE({
    haltList,
    activeRegData,
    activeRegHaltList,
    activeSSCBData,
    liftedData,
    pendingData,
    notExtendedList,
    setActiveRegData,
    setActiveSSCBData,
    setLiftedData,
    setPendingData,
    setActiveRegHaltList,
    setNotExtendedList
  });

  // Initialize SSE on mount
  useEffect(() => {
    getSSETicket();
  }, []);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        height: window.innerHeight,
        width: window.innerWidth
      });
    };

    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleNewHaltModalOpen = () => {
    setNewHaltModalOpen(true);
  };

  const handleNewHaltModalClose = () => {
    setNewHaltModalOpen(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading && (!activeRegData.length && !activeSSCBData.length && !pendingData.length && !liftedData.length)) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchActiveHalts} />;
  }

  return (
    <div className="dashboard-main-container">
      <div className="dashboard-content">
        <DashboardTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            activeReg: activeRegData.length,
            activeSSCB: activeSSCBData.length,
            pending: pendingData.length,
            lifted: liftedData.length
          }}
          onNewHaltClick={handleNewHaltModalOpen}
          windowHeight={windowDimensions.height}
        />

        <CreateNewHaltModal
          open={newHaltModalOpen}
          onClose={handleNewHaltModalClose}
          securities={securities}
          haltReasons={haltReasons}
          onHaltCreated={fetchActiveHalts}
        />

        <Box
          sx={{
            height: "100%",
            width: "98%",
            bgcolor: "#6d8b89",
            marginTop: -0.9,
            marginLeft: 2,
            marginRight: 1,
            padding: 1,
            flex: 1
          }}
        >
          {activeTab === 'reg' && (
            <ActiveRegTable
              data={activeRegData}
              activeRegHaltList={activeRegHaltList}
              notExtendedList={notExtendedList}
              onExtendedHaltUpdate={updateExtendedHaltState}
            />
          )}
          {activeTab === 'sscb' && (
            <ActiveSSCBTable data={activeSSCBData} />
          )}
          {activeTab === 'pending' && (
            <PendingTable data={pendingData} />
          )}
          {activeTab === 'lifted' && (
            <LiftedTable data={liftedData} />
          )}
        </Box>

        <Notification
          open={showNotification}
          message={notification}
          onClose={hideNotification}
          severity="info"
          autoHideDuration={window.runConfig?.notificationTimeout || 3000}
        />
      </div>
    </div>
  );
};

export default Dashboard;