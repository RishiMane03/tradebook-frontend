import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const strategyId = location.pathname.split("/")[2]; // Extract strategyId from URL
  const { logout, isAuthenticating, isAdmin, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDashboard = async () => {
    try {
      const res = await api.get("/strategies/last-opened");
      if (res.data) {
        navigate(`/dashboard/${res.data._id}`);
      } else {
        navigate("/"); // if no strategy exists
      }
    } catch (error) {
      console.error("Error fetching last opened strategy:", error);
    }
  };

  const isRouteActive = (
    route:
      | "home"
      | "admin"
      | "dashboard"
      | "trade-list"
      | "notes"
      | "analytics",
  ) => {
    const { pathname } = location;
    if (route === "home") return pathname === "/";
    if (route === "admin") return pathname.startsWith("/admin");
    if (route === "trade-list") return pathname.startsWith("/trade-list");
    if (route === "notes") return pathname.startsWith("/notes");
    if (route === "analytics") return pathname.startsWith("/analytics"); 
    return pathname.startsWith("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center justify-between px-5 py-4 animate-in fade-in slide-in-from-top-1 duration-300">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="cursor-pointer group flex items-center gap-3 rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Go to home"
          >
            <div className="flex flex-col gap-4 leading-tight text-left">
              {user?.displayName ? (
                <span className="text-sm text-muted-foreground">
                  <span className="capitalize">
                    {user.displayName}
                    <span>'s</span>
                  </span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Welcome to
                </span>
              )}
              {/* <span className="text-lg font-semibold tracking-tight transition-colors group-hover:text-foreground/90">
                TradeBook
              </span> */}
              <span
                className="text-sm tracking-tight transition-colors group-hover:text-foreground/90"
                style={{ fontFamily: "Rockybilly" }}
              >
                TradeBook
              </span>
            </div>
          </button>

          <nav
            aria-label="Primary"
            className="flex items-center gap-1 rounded-full border bg-muted/70 p-1 shadow-sm"
          >
            {isAuthenticating && isAdmin && (
              <button
                type="button"
                data-active={isRouteActive("admin")}
                onClick={() => navigate("/admin")}
                className="cursor-pointer relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:origin-center after:scale-x-0 hover:after:scale-x-100 data-[active=true]:after:scale-x-100"
              >
                Admin
              </button>
            )}

            <button
              type="button"
              data-active={isRouteActive("home")}
              onClick={() => navigate("/")}
              className="cursor-pointer relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:origin-center after:scale-x-0 hover:after:scale-x-100 data-[active=true]:after:scale-x-100"
            >
              Home
            </button>

            {location.pathname !== "/" && (
              <button
                type="button"
                data-active={isRouteActive("dashboard")}
                onClick={handleDashboard}
                className="cursor-pointer relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:origin-center after:scale-x-0 hover:after:scale-x-100 data-[active=true]:after:scale-x-100"
              >
                Dashboard
              </button>
            )}

            {location.pathname !== "/" && (
              <button
                type="button"
                data-active={isRouteActive("trade-list")}
                onClick={() => navigate(`/trade-list/${strategyId}`)}
                className="cursor-pointer relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:origin-center after:scale-x-0 hover:after:scale-x-100 data-[active=true]:after:scale-x-100"
              >
                History
              </button>
            )}

            {location.pathname !== "/" && (
              <button
                type="button"
                data-active={isRouteActive("notes")}
                onClick={() => navigate(`/notes/${strategyId}`)}
                className="cursor-pointer relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:origin-center after:scale-x-0 hover:after:scale-x-100 data-[active=true]:after:scale-x-100"
              >
                Notes
              </button>
            )}

            {location.pathname !== "/" && (
              <button
                type="button"
                data-active={isRouteActive("analytics")}
                onClick={() => navigate(`/full-analytics/${strategyId}`)}
                className="cursor-pointer relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:origin-center after:scale-x-0 hover:after:scale-x-100 data-[active=true]:after:scale-x-100"
              >
                Analytics
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer relative rounded-full px-3 py-1.5 text-sm font-medium text-destructive transition-all duration-200 ease-out hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-destructive after:transition-transform after:duration-200 after:origin-center after:scale-x-0 hover:after:scale-x-100"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="p-5">
        <Outlet />
      </main>
    </div>
  );
}
