import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import SecureLS from "secure-ls";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

// Note: loadState function is no longer used as we don't restore auth state on app startup
// This ensures users must explicitly log in and old tokens are not auto-restored
// The function is kept here for reference in case persistent login is needed in the future
// const loadState = () => {
//   try {
//     return secureLS.get("authState");
//   } catch (err) {
//     console.error("Error loading state from SecureLS:", err);
//     return undefined;
//   }
// };

// Auth state interface for persistence
interface PersistedAuthState {
  isAuthenticated: boolean;
  user: { id: number; username: string; is_staff: boolean; is_superuser: boolean } | null;
  accessToken: string | null;
  refreshToken: string | null;
  showLogoutMessage: boolean;
}

interface RootStateForPersistence {
  auth: PersistedAuthState;
}

// Function to save state to SecureLS
const saveState = (state: RootStateForPersistence) => {
  try {
    // Store auth state including both tokens and showLogoutMessage
    const stateToSave = {
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user
        ? {
            id: state.auth.user.id,
            username: state.auth.user.username,
            is_staff: state.auth.user.is_staff,
            is_superuser: state.auth.user.is_superuser
          }
        : null,
      accessToken: state.auth.accessToken,
      refreshToken: state.auth.refreshToken,
      showLogoutMessage: state.auth.showLogoutMessage,
    };
    secureLS.set("authState", stateToSave);
  } catch (err) {
    console.error("Error saving state to SecureLS:", err);
  }
};

// Create the store without preloading persisted auth state
// This ensures the app always starts in an unauthenticated state
// Users must explicitly log in to get authenticated
export const createStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    // Do not preload auth state from SecureLS - always start unauthenticated
    preloadedState: undefined,
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
