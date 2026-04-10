import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import SecureLS from "secure-ls";

const secureLS = new SecureLS({ encodingType: "aes" });

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

const AUTH_STORAGE_KEY = "authState";

const isPersistedAuthState = (value: unknown): value is PersistedAuthState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const authValue = value as Partial<PersistedAuthState>;
  const userValue = authValue.user;

  const isValidUser =
    userValue === null ||
    (typeof userValue === "object" &&
      userValue !== null &&
      typeof userValue.id === "number" &&
      typeof userValue.username === "string" &&
      typeof userValue.is_staff === "boolean" &&
      typeof userValue.is_superuser === "boolean");

  return (
    typeof authValue.isAuthenticated === "boolean" &&
    isValidUser &&
    (typeof authValue.accessToken === "string" || authValue.accessToken === null) &&
    (typeof authValue.refreshToken === "string" || authValue.refreshToken === null) &&
    typeof authValue.showLogoutMessage === "boolean"
  );
};

const loadPersistedAuthState = (): Partial<RootStateForPersistence> | undefined => {
  try {
    const storedAuthState = sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedAuthState) {
      return undefined;
    }

    const parsedState = JSON.parse(storedAuthState) as unknown;

    if (isPersistedAuthState(parsedState)) {
      return {
        auth: parsedState,
      };
    }

    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error("Error loading state from sessionStorage:", err);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return undefined;
};

const saveState = (state: RootStateForPersistence) => {
  try {
    if (!state.auth.isAuthenticated) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      secureLS.remove(AUTH_STORAGE_KEY);
      return;
    }

    const stateToSave = {
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user
        ? {
            id: state.auth.user.id,
            username: state.auth.user.username,
            is_staff: state.auth.user.is_staff,
            is_superuser: state.auth.user.is_superuser,
          }
        : null,
      accessToken: state.auth.accessToken,
      refreshToken: state.auth.refreshToken,
      showLogoutMessage: state.auth.showLogoutMessage,
    };

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stateToSave));
    secureLS.set(AUTH_STORAGE_KEY, stateToSave);
  } catch (err) {
    console.error("Error saving state to sessionStorage:", err);
  }
};

export const createStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: loadPersistedAuthState(),
  });

  store.subscribe(() => {
    saveState(store.getState());
  });

  return store;
};

const store = createStore();

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;