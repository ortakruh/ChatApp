import { User } from "@shared/schema";

let currentUser: User | null = null;

export const auth = {
  getCurrentUser: (): User | null => currentUser,
  setCurrentUser: (user: User | null) => {
    currentUser = user;
  },
  isAuthenticated: (): boolean => currentUser !== null,
  logout: () => {
    currentUser = null;
  }
};
