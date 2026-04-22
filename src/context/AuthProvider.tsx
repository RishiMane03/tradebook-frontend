import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const googleProvider = new GoogleAuthProvider();

  // Get admin emails from environment variable and split into an array
  const adminEmails =
    import.meta.env.VITE_ADMIN_EMAILS?.split(",").map((email: string) =>
      email.trim(),
    ) || [];

  const checkIsAdmin = (u: User | null) =>
    adminEmails.includes((u?.email ?? "").toLowerCase());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticating(true);
        setIsAdmin(checkIsAdmin(firebaseUser));
        setLoading(false);
      } else {
        setUser(null);
        setIsAuthenticating(false);
        setIsAdmin(false);
        setLoading(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (crediential: { email: string; password: string }) => {
    try {
      const response = await signInWithEmailAndPassword(
        auth,
        crediential.email,
        crediential.password,
      );
      const user = response.user;
      console.log("Logged in user:", user);
      setUser(user);
      setIsAdmin(checkIsAdmin(user));
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Logged in with Google:", user);
      setUser(user);
      setIsAdmin(checkIsAdmin(user));
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setIsAdmin(false);
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const signup = async (crediential: {
    email: string;
    password: string;
    name?: string;
  }) => {
    try {
      const firebaseResponse = await createUserWithEmailAndPassword(
        auth,
        crediential.email,
        crediential.password,
      );

      const newUser = firebaseResponse.user;

      if (crediential.name) {
        await updateProfile(newUser, {
          displayName: crediential.name,
        });
      }

      // Ensure we have the latest profile data from Firebase
      await newUser.reload();
      const refreshedUser = auth.currentUser ?? newUser;

      const finalUser = {
        ...refreshedUser,
        displayName:
          crediential.name ||
          refreshedUser.displayName ||
          newUser.displayName,
      } as User;

      setUser(finalUser);
      setIsAdmin(checkIsAdmin(finalUser));
      setIsAuthenticating(true);
      return true;
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          console.error("This email is already in use. Please log in.");
        } else if (error.code === "auth/network-request-failed") {
          console.error(
            "Network error. Please check your internet connection.",
          );
        } else {
          console.error("Signup error:", error.message);
        }
      } else {
        console.error("Signup error:", error);
      }
      return false;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        loginWithGoogle,
        user,
        logout,
        isAuthenticating,
        loading,
        signup,
        forgotPassword,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
