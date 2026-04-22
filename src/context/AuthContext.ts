import type { User } from "firebase/auth";
import { createContext } from "react";

export interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticating: boolean;
  loading: boolean;
  signup: (credential: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<boolean>;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; message?: string }>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
