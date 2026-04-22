import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { useEffect, useState, type JSX } from "react";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const [path, setPath] = useState("");
  useEffect(() => {
    const getLatestStrategy = async () => {
      try {
        const res = await api.get("/strategies/last-opened");
        if (res.data) {
          setPath(`/dashboard/${res.data._id}`);
        } else {
          setPath("/");
        }
      } catch (error) {
        console.error("Error fetching latest strategy:", error);
      }
    };
    getLatestStrategy();
  }, []);

  if (loading) return null;

  if (user) {
    return <Navigate to={path} replace />;
  }

  return children;
}
