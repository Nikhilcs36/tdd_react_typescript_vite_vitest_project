import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import SecureLS from "secure-ls";
import { AuthState } from "./types";

const secureLS = new SecureLS({ encodingType: "aes" });

interface RootStateForPersistence {
  auth: AuthState;
}

const AUTH_STORAGE_KEY = "authState";

const isPersistedAuthState = (value: unknown): value is AuthState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const authValue = value as Partial<AuthState>;
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

const DEFAULT_AUTH_FIELDS = {
  logins_remaining_for_staff: 0,
  staff_access_granted: false,
  active_role: "regular" as const,
  role_label: "Regular",
};

const migrateAuthUser = (user: AuthState["user"]): AuthState["user"] => {
  if (!user) return null;
  return {
    ...DEFAULT_AUTH_FIELDS,
    ...user,
  };
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
        auth: {
          ...parsedState,
          user: migrateAuthUser(parsedState.user),
        },
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
            logins_remaining_for_staff: state.auth.user.logins_remaining_for_staff,
            staff_access_granted: state.auth.user.staff_access_granted,
            active_role: state.auth.user.active_role,
            role_label: state.auth.user.role_label,
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