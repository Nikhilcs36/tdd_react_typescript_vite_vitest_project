import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import SecureLS from "secure-ls";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

// Function to load state from SecureLS
const loadState = () => {
  try {
    return secureLS.get("authState");
  } catch (err) {
    console.error("Error loading state from SecureLS:", err);
    return undefined;
  }
};

// Function to save state to SecureLS
const saveState = (state: any) => {
  try {
    // Store auth state including token
    const stateToSave = {
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user
        ? { id: state.auth.user.id, username: state.auth.user.username }
        : null,
      token: state.auth.token, // Save token to SecureLS
    };
    secureLS.set("authState", stateToSave);
  } catch (err) {
    console.error("Error saving state to SecureLS:", err);
  }
};

// Create the store with preloaded state from SecureLS
export const createStore = () => {
  const persistedState = loadState();

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: persistedState ? { auth: persistedState } : undefined,
  });

  // Subscribe to store changes to save state to SecureLS
  store.subscribe(() => {
    saveState(store.getState());
  });

  return store;
};

// Create the default store
const store = createStore();

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
