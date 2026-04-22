import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  requireAdmin,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) => {
  const { user, isAuthenticating, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner /> <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticating) {
    return <Navigate to="/auth" state={{ from: location.pathname }} />;
  }

  if (!user) {
    return <div>Access Denied. Please log in.</div>;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex flex-col gap-3 text-center items-center justify-center h-screen">
        <h1 className="text-lg font-bold">
          Access Denied <br />
          You do not have permission to view this page
        </h1>
        <Button variant="outline" onClick={() => navigate("/")}>
          Let's Go Home
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
