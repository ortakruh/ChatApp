import { User } from "@shared/schema";

let currentUser: User | null = null;

// Initialize from localStorage on load
const initializeAuth = () => {
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  const savedUser = localStorage.getItem('currentUser');
  
  if (rememberMe && savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (error) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberMe');
    }
  }
};

// Initialize auth on module load
initializeAuth();

export const auth = {
  getCurrentUser: (): User | null => currentUser,
  setCurrentUser: (user: User | null, rememberMe = false) => {
    currentUser = user;
    
    if (rememberMe && user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('rememberMe', 'true');
    } else if (user && localStorage.getItem('rememberMe') === 'true') {
      // Update existing saved user
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else if (!rememberMe) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberMe');
    }
  },
  isAuthenticated: (): boolean => currentUser !== null,
  logout: () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
  }
};
