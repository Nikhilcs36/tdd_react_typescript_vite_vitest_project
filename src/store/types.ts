// This file contains all the action types for the redux store.

// Represents the shape of a user object
export interface User {
  id: number;
  username: string;
  email: string;
  image: string | null;
}

// Represents the state of the user slice
export interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Represents the payload for the updateSuccess action
export type UpdateSuccessPayload = {
  user: User;
};
