import QuickAction from "@/components/dashboard/QuickAction";
import QuickAnalytics from "@/components/dashboard/QuickAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type DashboardData = {
  name?: string;
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { strategyId } = useParams<{ strategyId: string }>();

  useEffect(() => {
    if (!strategyId) {
      return;
    }

    let cancelled = false;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.put<DashboardData>(
          `/strategies/${strategyId}/open`,
        );
        if (!cancelled) setDashboardData(res.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (!cancelled)
          setError(
            "Couldn’t load this strategy dashboard. Please refresh and try again.",
          );
      }
      if (!cancelled) setIsLoading(false);
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [strategyId]);

  if (!strategyId) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No strategy selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-linear-to-tr from-emerald-500/25 via-sky-500/20 to-purple-500/25 blur-3xl" />
        <div className="absolute right-[-8rem] bottom-[-10rem] h-[22rem] w-[22rem] rounded-full bg-linear-to-tr from-orange-500/20 via-rose-500/15 to-amber-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {isLoading ? (
                <Skeleton className="h-9 w-64" />
              ) : (
                <span className="capitalize">
                  {dashboardData?.name
                    ? `${dashboardData.name} dashboard`
                    : "Dashboard"}
                </span>
              )}
            </h1>

            <p className="text-sm text-muted-foreground">
              Quick actions, performance profile, and key metrics at a glance.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          <QuickAction />
          <QuickAnalytics />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
