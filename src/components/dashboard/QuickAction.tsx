import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { normalizeEquityCurve, type EquityPoint } from "@/lib/equity";
import { ArrowUpRight, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Spinner } from "../ui/spinner";

type Analytics = {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  profitFactor: number;
  equityCurve?: EquityPoint[];
};

const formatPnl = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const QuickAction = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { strategyId } = useParams();

  useEffect(() => {
    if (!strategyId) return;

    let isMounted = true;
    const fetchData = async () => {
      try {
        if (isMounted) setIsLoading(true);
        const res = await api.get(`/analytics/${strategyId}`);
        if (isMounted) {
          const apiAnalytics = res.data.analytics as Analytics;
          const apiEquityCurve = (apiAnalytics.equityCurve ?? []) as EquityPoint[];
          setEquityCurve(normalizeEquityCurve(apiEquityCurve));
          setAnalytics(apiAnalytics);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        if (isMounted) {
          setAnalytics(null);
          setEquityCurve([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [strategyId]);

  // ✅ Check if overall performance is profitable
  const finalEquity =
    equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].equity : 0;

  const isProfitable = finalEquity >= 0;
  const performanceLabel =
    analytics === null
      ? isLoading
        ? "Loading"
        : "No data"
      : isProfitable
        ? "Profitable"
        : "Drawdown";

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Log a trade or review your history.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            className="justify-between"
            onClick={() => navigate(`/trade-entry/${strategyId}`)}
          >
            <span className="flex items-center gap-2">
              <Plus className="text-emerald-400" />
              New trade
            </span>
            <ArrowUpRight className="opacity-70" />
          </Button>

          <Button
            variant="outline"
            className="justify-between"
            onClick={() => navigate(`/trade-list/${strategyId}`)}
          >
            <span className="flex items-center gap-2">
              <Plus />
              View history
            </span>
            <ArrowUpRight className="opacity-70" />
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Performance Profile</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                analytics === null
                  ? "bg-muted text-muted-foreground"
                  : isProfitable
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {analytics === null ? null : isProfitable ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {performanceLabel}
            </span>
          </CardTitle>
          <CardDescription>Equity curve snapshot and net PnL.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && analytics === null ? (
            <div className="space-y-3">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : analytics === null ? (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              Add a few trades to unlock the performance profile.
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/20 p-6 text-sm text-muted-foreground">
              <Spinner /> Updating…
            </div>
          ) : (
            <>
              <div className="h-44 w-full rounded-xl border bg-muted/10 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isProfitable ? "#16a34a" : "#dc2626"}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={isProfitable ? "#16a34a" : "#dc2626"}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--border))" }}
                      formatter={(value) => [formatPnl(Number(value)), "Equity"]}
                      labelFormatter={() => ""}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke={isProfitable ? "#16a34a" : "#dc2626"}
                      strokeWidth={2}
                      fill="url(#equityGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickAction;
