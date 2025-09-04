import * as React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { useDemoRouter } from '@toolpad/core/internal';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Box from '@mui/material/Box';
import SubjectIcon from '@mui/icons-material/Subject';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { green } from '@mui/material/colors';


const NAVIGATION = [
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'history',
    title: 'History',
    icon: <SubjectIcon />,
  },
  {
    segment: 'calendar',
    title: 'Calendar',
    icon: <CalendarMonthIcon />,
  },
];

// const demoTheme = createTheme(
//     {
// //   cssVariables: {
// //     colorSchemeSelector: 'data-toolpad-color-scheme',
// //   },
// //   colorSchemes: { light: true, dark: true },
//   breakpoints: {
//     values: {
//       xs: 0,
//       sm: 600,
//       md: 600,
//       lg: 1200,
//       xl: 1536,
//     },
//   },
// }
// );

  
// const demoTheme = createTheme({cssVariables: true,});

const demoTheme = createTheme({
    palette: {
      primary: {
        light: '#589B7B',
        main: '#296847',
        dark: '#23593B',
        contrastText: '#fff',
      }
    },
});

function DemoPageContent({ pathname }) {
  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography>Dashboard content for {pathname}</Typography>
    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
};

function DashboardLayoutBranding(props) {
//   const { window } = props;

  const router = useDemoRouter('/dashboard');

  // Remove this const when copying and pasting into your project.
//   const demoWindow = window !== undefined ? window() : undefined;

  return (
    <AppProvider
      navigation={NAVIGATION}
      sx={{}}
      branding={{
        logo: <img src="https://media.licdn.com/dms/image/v2/D4E0BAQHNUCsZONKn-w/company-logo_200_200/company-logo_200_200/0/1726596925340/ciro_canadian_investment_regulatory_organization_logo?e=2147483647&v=beta&t=9bNvkVlJRw8D-Y4_qLLVk-jYUpN3oOxvw2J6hoDDAJs" alt="MUI logo" />,
        title: 'Equity Management Portal',
        homeUrl: '/dashboard',
      }}
      router={router}
      theme={demoTheme}
    //   window={demoWindow}
    >
      <DashboardLayout>
        {/* <DemoPageContent pathname={router.pathname} /> */}
      </DashboardLayout>
    </AppProvider>
  );
}

// DashboardLayoutBranding.propTypes = {
//   /**
//    * Injected by the documentation to work in an iframe.
//    * Remove this when copying and pasting into your project.
//    */
//   window: PropTypes.func,
// };

export default DashboardLayoutBranding;
