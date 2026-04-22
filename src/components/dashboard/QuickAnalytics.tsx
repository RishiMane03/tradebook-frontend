import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  Banknote,
  ChartCandlestick,
  IndianRupee,
  Plus,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spinner } from "../ui/spinner";
import { TradeCalendar } from "./TradeCalendar";

type EquityPoint = {
  date: string;
  equity: number;
};

type Analytics = {
  winRate: number;
  totalPnL: number;
  totalTrades: number;
  profitFactor: number;
  equityCurve?: EquityPoint[];
};

type TradeDay = {
  date: string;
  pnl: number;
  trades: number;
};

const QuickAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!strategyId) return;

    let isMounted = true;
    const fetchData = async () => {
      try {
        if (isMounted) setIsLoading(true);
        const res = await api.get(`/analytics/${strategyId}`);
        if (isMounted) {
          setAnalytics(res.data.analytics);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [strategyId]);

  const calendarData = useMemo<TradeDay[]>(() => {
    const curve = analytics?.equityCurve ?? [];
    if (!curve.length) return [];

    let previousEquity = 0;
    return curve.map((point) => {
      const dailyPnl = point.equity - previousEquity;
      previousEquity = point.equity;

      return {
        date: point.date.slice(0, 10),
        trades: 1,
        pnl: dailyPnl,
      };
    });
  }, [analytics?.equityCurve]);

  const formatCurrency = (value: number) =>
    `₹${new Intl.NumberFormat("en-IN").format(value)}`;

  const StatCard = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string;
    icon: ReactNode;
  }) => (
    <div className="rounded-2xl border bg-muted/10 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl border bg-background text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isLoading ? (
        <div className="w-full space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Quick Analytics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </CardContent>
          </Card>

          <div className="flex items-center justify-center rounded-2xl border bg-muted/10 p-6 text-sm text-muted-foreground">
            <Spinner /> Getting analytics…
          </div>
        </div>
      ) : analytics === null ? (
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Quick Analytics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted/10">
              <ChartCandlestick className="text-muted-foreground" />
            </div>
            <div className="max-w-xl space-y-1">
              <p className="text-sm font-medium">No trades yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first trade to unlock quick stats and the calendar
                view.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={() => navigate(`/trade-entry/${strategyId}`)}
                disabled={!strategyId}
              >
                <Plus /> Add trade
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          <>
            <Card className="w-full">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Quick Analytics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Win Rate"
                  value={`${analytics?.winRate}%`}
                  icon={<Target className="size-4" />}
                />
                <StatCard
                  label="Total PnL"
                  value={formatCurrency(analytics?.totalPnL ?? 0)}
                  icon={<IndianRupee className="size-4" />}
                />
                <StatCard
                  label="Total Trades"
                  value={`${analytics?.totalTrades}`}
                  icon={<ChartCandlestick className="size-4" />}
                />
                <StatCard
                  label="Profit Factor"
                  value={`${analytics?.profitFactor}`}
                  icon={<Banknote className="size-4" />}
                />
              </CardContent>
            </Card>

            {/* Calender */}
            <div className="pt-6 w-full">
              <TradeCalendar data={calendarData} />
            </div>
          </>
        </div>
      )}
    </>
  );
};

export default QuickAnalytics;
