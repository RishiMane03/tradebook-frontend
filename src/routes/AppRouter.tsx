import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Auth from "@/pages/Auth";
import { lazy, Suspense } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

// Layouts
const AppLayout = lazy(() => import("../layouts/AppLayout"));
const AuthLayout = lazy(() => import("../layouts/AuthLayout"));

// Pages
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Admin = lazy(() => import("../pages/Admin"));
const Home = lazy(() => import("../pages/Home"));
const TradeEntry = lazy(() => import("../pages/TradeEntry"));
const TradeList = lazy(() => import("../pages/TradeList"));
const Notes = lazy(() => import("../pages/Notes"));
const FullAnalytics = lazy(() => import("../pages/FullAnalytics"));

export default function AppRouter() {
  const navigate = useNavigate();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            }
          />
        </Route>

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard/:strategyId" element={<Dashboard />} />
          <Route path="/" element={<Home />} />
          <Route path="/trade-entry/:strategyId" element={<TradeEntry />} />
          <Route path="/trade-list/:strategyId" element={<TradeList />} />
          <Route path="/notes/:strategyId" element={<Notes />} />
          <Route path="/full-analytics/:strategyId" element={<FullAnalytics />} />
        </Route>

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route
          path="*"
          element={
            <div className="flex flex-col gap-3 items-center justify-center h-screen">
              <h1 className="text-2xl font-semibold ">404 Page Not Found</h1>
              <Button onClick={() => navigate("/")}>Let's Go Home</Button>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
