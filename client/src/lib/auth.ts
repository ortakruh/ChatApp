import { User } from "@shared/schema";

let currentUser: User | null = null;

// Initialize from localStorage or sessionStorage on load
const initializeAuth = () => {
  // First check sessionStorage (current session)
  let savedUser = sessionStorage.getItem('currentUser');
  
  if (!savedUser) {
    // Then check localStorage (persistent login)
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (rememberMe) {
      savedUser = localStorage.getItem('currentUser');
    }
  }
  
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (error) {
      sessionStorage.removeItem('currentUser');
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
    
    if (user) {
      // Always save to sessionStorage for current session
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      if (rememberMe) {
        // Save to localStorage for persistence across browser sessions
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('rememberMe', 'true');
      }
    } else {
      sessionStorage.removeItem('currentUser');
      if (!rememberMe) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberMe');
      }
    }
  },
  isAuthenticated: (): boolean => currentUser !== null,
  logout: () => {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
  }
};
