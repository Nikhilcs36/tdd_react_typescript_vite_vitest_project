import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

// Function to load state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem("authState");
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

// Function to save state to localStorage
const saveState = (state: any) => {
  try {
    // Only store non-sensitive information
    const stateToSave = {
      isAuthenticated: state.isAuthenticated,
      user: state.user
        ? { id: state.user.id, username: state.user.username }
        : null,
    };
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem("authState", serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

// Create the store with preloaded state from localStorage
export const createStore = () => {
  const persistedState = loadState();

  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: persistedState ? { auth: persistedState } : undefined,
  });

  // Subscribe to store changes to save state to localStorage
  store.subscribe(() => {
    saveState(store.getState().auth);
  });

  return store;
};

// Create the default store
const store = createStore();

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;