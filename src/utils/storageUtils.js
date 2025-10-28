import Cookies from 'universal-cookie';
import { DEFAULT_SORT_PREFERENCES } from '../constants';

const cookies = new Cookies();

// Local Storage utilities
export const storage = {
  get: (key) => localStorage.getItem(key),
  set: (key, value) => localStorage.setItem(key, value),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

// Cookie utilities
export const cookieUtils = {
  get: (key) => cookies.get(key),
  set: (key, value, options = {}) => cookies.set(key, value, options),
  remove: (key) => cookies.remove(key)
};

// Authentication utilities
export const authUtils = {
  getToken: () => storage.get('token'),
  setToken: (token) => storage.set('token', token),
  removeToken: () => storage.remove('token'),

  getLoggedInUser: () => storage.get('loggedInUser'),
  setLoggedInUser: (user) => storage.set('loggedInUser', user),
  removeLoggedInUser: () => storage.remove('loggedInUser'),

  isLoggedIn: () => { return storage.get('loggedIn') === 'true' && cookieUtils.get('userLogInCookie') !== null },
  setLoggedIn: (status) => storage.set('loggedIn', status),
  removeLoggedIn: () => storage.remove('loggedIn'),

  logout: () => {
    storage.remove('token');
    storage.remove('loggedIn');
    storage.remove('loggedInUser');
    cookieUtils.remove('userLogIn');
    cookieUtils.remove('userLogInCookie');
  }
};

// Sort preferences utilities
export const sortUtils = {
  initializeSortPreferences: () => {
    for (const [key, value] of Object.entries(DEFAULT_SORT_PREFERENCES)) {
      if (storage.get(key) === null) {
        storage.set(key, value);
      }
    }
  },

  getSortPreference: (key) => storage.get(key),
  setSortPreference: (key, value) => storage.set(key, value)
};

// Hide extended halt preference
export const hideExtendedUtils = {
  get: () => cookieUtils.get('userHideExtendedHalt') || false,
  set: (value) => cookieUtils.set('userHideExtendedHalt', value)
};