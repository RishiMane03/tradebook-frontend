import { createContext, useContext } from 'react';
import { User } from '../types';

export type AuthContextType = {
  user: User | null;
  login: (cred: { email: string; password: string }) => Promise<void> | void;
  logout: () => Promise<void> | void;
  signup: (cred: { email: string; password: string; name?: string }) => Promise<boolean> | void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  isAuthenticating: boolean;
  loading: boolean;
  isAdmin: boolean; // <-- added
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => false,
  forgotPassword: async () => ({ success: false }),
  isAuthenticating: false,
  loading: true,
  isAdmin: false, // <-- added
});