import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { compareAsc, format, parseISO } from "date-fns";
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  ChartCandlestick,
  Gauge,
  RefreshCcw,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Strategy = {
  _id: string;
  name: string;
};

type EquityPoint = {
  date: string;
  equity: number;
};

type Analytics = {
  winRate: number;
  totalPnL: number;
  totalTrades: number;
  grossProfit?: number;
  grossLoss?: number;
  avgWin?: number;
  avgLoss?: number;
  profitFactor: number;
  expectancy?: number;
  largestWin?: number;
  largestLoss?: number;
  maxDrawdown?: number;
  equityCurve?: EquityPoint[];
};

const FullAnalytics = () => {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();

  const formatCurrency = useCallback((value: number) => {
    const abs = Math.abs(value);
    const formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: abs >= 1000 ? 0 : 2,
    }).format(abs);

    if (value < 0) return `-₹${formatted}`;
    return `₹${formatted}`;
  }, []);

  const formatSignedCurrency = useCallback(
    (value: number) => {
      if (value === 0) return formatCurrency(0);
      const prefix = value > 0 ? "+" : "-";
      return `${prefix}${formatCurrency(Math.abs(value)).replace("-", "")}`;
    },
    [formatCurrency],
  );

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return true;
    return (
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? true
    );
  }, []);

  const AnimatedNumber = ({
    value,
    formatValue,
    durationMs = 700,
    className,
  }: {
    value: number;
    formatValue: (v: number) => string;
    durationMs?: number;
    className?: string;
  }) => {
    const [displayValue, setDisplayValue] = useState<number>(value);
    const previousValueRef = useRef<number>(value);

    useEffect(() => {
      if (prefersReducedMotion) {
        setDisplayValue(value);
        previousValueRef.current = value;
        return;
      }

      const from = previousValueRef.current;
      const to = value;
      previousValueRef.current = to;
      if (from === to) return;

      let raf = 0;
      const start = performance.now();

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = easeOutCubic(t);
        setDisplayValue(from + (to - from) * eased);
        if (t < 1) raf = requestAnimationFrame(step);
      };

      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [value, durationMs, prefersReducedMotion]);

    return (
      <span className={cn("tabular-nums", className)}>
        {formatValue(displayValue)}
      </span>
    );
  };

  const loadAnalytics = useCallback(
    async ({
      mode,
      signal,
    }: {
      mode: "initial" | "refresh";
      signal?: AbortSignal;
    }) => {
      if (!strategyId) return;

      try {
        setError(null);
        if (mode === "initial") setIsLoading(true);
        if (mode === "refresh") setIsRefreshing(true);

        const res = await api.get(`/analytics/${strategyId}`, {
          signal,
        });

        if (!isMountedRef.current) return;
        setStrategy(res.data?.strategy ?? null);
        setAnalytics(res.data?.analytics ?? null);
      } catch (err) {
        if (!isMountedRef.current) return;
        if ((err as { name?: string })?.name === "CanceledError") return;

        console.error("Error fetching analytics data:", err);
        setError("Couldn’t load analytics. Please try again.");
        setStrategy(null);
        setAnalytics(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [strategyId],
  );

  useEffect(() => {
    if (!strategyId) return;
    const controller = new AbortController();
    void loadAnalytics({ mode: "initial", signal: controller.signal });
    return () => controller.abort();
  }, [strategyId, loadAnalytics]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const equityData = useMemo(() => {
    const curve = analytics?.equityCurve ?? [];
    if (!curve.length) return [];

    return [...curve]
      .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)))
      .map((point) => {
        const parsed = parseISO(point.date);
        return {
          dateLabel: format(parsed, "dd MMM"),
          fullDate: format(parsed, "dd MMM yyyy"),
          equity: point.equity,
        };
      });
  }, [analytics?.equityCurve]);

  const pnl = analytics?.totalPnL ?? 0;
  const isProfitable = pnl >= 0;
  const curveRange = useMemo(() => {
    if (!equityData.length) return null;
    const start = equityData[0]?.fullDate;
    const end = equityData[equityData.length - 1]?.fullDate;
    return start && end ? `${start} — ${end}` : null;
  }, [equityData]);

  const MetricCard = ({
    label,
    value,
    hint,
    icon,
    tone = "neutral",
    className,
  }: {
    label: string;
    value: ReactNode;
    hint?: string;
    icon: ReactNode;
    tone?: "good" | "bad" | "neutral";
    className?: string;
  }) => (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card/60 p-5 shadow-sm backdrop-blur transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:border-border/70",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          tone === "good" &&
            "bg-linear-to-br from-emerald-500/14 via-sky-500/10 to-purple-500/12",
          tone === "bad" &&
            "bg-linear-to-br from-rose-500/14 via-orange-500/10 to-purple-500/12",
          tone === "neutral" &&
            "bg-linear-to-br from-sky-500/10 via-purple-500/10 to-emerald-500/10",
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {hint ? (
            <div className="text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border bg-background/70 text-muted-foreground transition-colors",
            tone === "good" && "text-emerald-500",
            tone === "bad" && "text-black",
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  const DetailTile = ({
    label,
    value,
    icon,
    tone,
    note,
    className,
  }: {
    label: string;
    value: ReactNode;
    icon: ReactNode;
    tone: "good" | "bad" | "neutral";
    note?: string;
    className?: string;
  }) => (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card/60 p-4 shadow-sm backdrop-blur transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg hover:border-border/70",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          tone === "good" &&
            "bg-linear-to-br from-emerald-500/14 via-sky-500/10 to-purple-500/12",
          tone === "bad" &&
            "bg-linear-to-br from-rose-500/14 via-orange-500/10 to-purple-500/12",
          tone === "neutral" &&
            "bg-linear-to-br from-sky-500/10 via-purple-500/10 to-emerald-500/10",
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tracking-tight">{value}</div>
          {note ? (
            <div className="text-xs text-muted-foreground">{note}</div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border bg-background/70 text-muted-foreground transition-colors",
            tone === "good" && "text-emerald-500",
            tone === "bad" && "text-black",
          )}
        >
          {icon}
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 bottom-3 h-px bg-linear-to-r from-transparent via-border/70 to-transparent opacity-60"
      />
    </div>
  );

  if (!strategyId) {
    return (
      <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-10 py-10">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Full Analytics</CardTitle>
            <CardDescription>No strategy selected.</CardDescription>
          </CardHeader>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Open a strategy dashboard first.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden">
      <style>
        {`
          @keyframes floaty {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(14px, -18px, 0) scale(1.05); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
          @keyframes floaty2 {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(-18px, 16px, 0) scale(1.06); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
        `}
      </style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-linear-to-tr from-emerald-500/22 via-sky-500/18 to-purple-500/22 blur-3xl motion-safe:animate-[floaty_12s_ease-in-out_infinite] motion-reduce:animate-none" />
        <div className="absolute right-[-10rem] bottom-[-12rem] h-[26rem] w-[26rem] rounded-full bg-linear-to-tr from-orange-500/18 via-rose-500/14 to-amber-500/18 blur-3xl motion-safe:animate-[floaty2_14s_ease-in-out_infinite] motion-reduce:animate-none" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-10 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dashboard/${strategyId}`)}
                className="rounded-full"
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Badge variant="secondary" className="rounded-full">
                Analytics
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Full Analytics
              {strategy?.name ? (
                <span className="text-muted-foreground font-medium">
                  {" "}
                  · <span className="capitalize">{strategy.name}</span>
                </span>
              ) : null}
            </h1>

            <p className="text-sm text-muted-foreground">
              Deep stats, equity curve, and risk snapshots — all in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void loadAnalytics({ mode: "refresh" })}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? (
                <Spinner className="mr-2" />
              ) : (
                <RefreshCcw className="mr-2 size-4" />
              )}
              Refresh
            </Button>

            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate(`/trade-list/${strategyId}`)}
            >
              View history <ArrowUpRight className="ml-2 size-4 opacity-70" />
            </Button>

            <Button
              className="rounded-full"
              onClick={() => navigate(`/trade-entry/${strategyId}`)}
            >
              Add trade <ArrowUpRight className="ml-2 size-4 opacity-70" />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in duration-300">
            {error}
          </div>
        ) : null}

        {isLoading && analytics === null ? (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-96 max-w-full" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[320px] w-full rounded-3xl" />
              </CardContent>
            </Card>
          </div>
        ) : analytics === null ? (
          <Card className="overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="border-b">
              <CardTitle className="text-base">
                Nothing to analyze yet
              </CardTitle>
              <CardDescription>
                Add a few trades and come back — this page will light up with
                charts and stats.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted/10">
                <BarChart3 className="text-muted-foreground" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => navigate(`/trade-entry/${strategyId}`)}>
                  Add trade <ArrowUpRight className="ml-2 size-4 opacity-70" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/trade-list/${strategyId}`)}
                >
                  View history
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                  <span className="flex items-center gap-2">
                    <Gauge className="size-4 text-muted-foreground" />
                    Snapshot
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                      isProfitable
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/10",
                    )}
                  >
                    {isProfitable ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {isProfitable ? "In the green" : "In drawdown"}
                  </span>
                </CardTitle>
                <CardDescription>
                  Key numbers that summarize this strategy right now.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total PnL"
                  value={
                    <AnimatedNumber
                      value={pnl}
                      formatValue={(v) => formatSignedCurrency(v)}
                    />
                  }
                  hint="Net performance"
                  tone={isProfitable ? "good" : "bad"}
                  icon={<Banknote className="size-5" />}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                />
                <MetricCard
                  label="Win Rate"
                  value={
                    <AnimatedNumber
                      value={Number(analytics.winRate ?? 0)}
                      formatValue={(v) => `${Math.round(v)}%`}
                      durationMs={650}
                    />
                  }
                  hint="Consistency"
                  tone="neutral"
                  icon={<Target className="size-5" />}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75"
                />
                <MetricCard
                  label="Profit Factor"
                  value={
                    <AnimatedNumber
                      value={Number(analytics.profitFactor ?? 0)}
                      formatValue={(v) => {
                        const safe = Number.isFinite(v) ? v : 0;
                        return safe.toFixed(2).replace(/\.00$/, "");
                      }}
                      durationMs={750}
                    />
                  }
                  hint="Profit / loss ratio"
                  tone={
                    Number(analytics.profitFactor ?? 0) >= 1 ? "good" : "bad"
                  }
                  icon={<BarChart3 className="size-5" />}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150"
                />
                <MetricCard
                  label="Total Trades"
                  value={
                    <AnimatedNumber
                      value={Number(analytics.totalTrades ?? 0)}
                      formatValue={(v) => `${Math.round(v)}`}
                      durationMs={600}
                    />
                  }
                  hint="Sample size"
                  tone="neutral"
                  icon={<ShieldAlert className="size-5" />}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200"
                />
              </CardContent>
            </Card>

            <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="text-base">Equity curve</CardTitle>
                  <CardDescription>
                    {curveRange ?? "Equity over time"}{" "}
                    {isRefreshing ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="size-3" /> Updating…
                      </span>
                    ) : null}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-3xl border bg-muted/10 p-3">
                    {equityData.length ? (
                      <ChartContainer
                        className="aspect-auto h-[320px] w-full"
                        config={{
                          equity: {
                            label: "Equity",
                            color: isProfitable ? "#16a34a" : "#e11d48",
                          },
                        }}
                      >
                        <AreaChart
                          data={equityData}
                          margin={{ left: 8, right: 14, top: 10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="faEquityGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={isProfitable ? "#16a34a" : "#e11d48"}
                                stopOpacity={0.28}
                              />
                              <stop
                                offset="95%"
                                stopColor={isProfitable ? "#16a34a" : "#e11d48"}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="dateLabel"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            minTickGap={18}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            width={68}
                            tickFormatter={(v) => formatCurrency(Number(v))}
                          />

                          <ChartTooltip
                            cursor={{ stroke: "hsl(var(--border))" }}
                            content={
                              <ChartTooltipContent
                                indicator="line"
                                labelFormatter={(_, payload) =>
                                  payload?.[0]?.payload?.fullDate ?? ""
                                }
                                formatter={(value) => (
                                  <div className="flex w-full items-center justify-between gap-6">
                                    <span className="text-muted-foreground">
                                      Equity
                                    </span>
                                    <span className="font-mono tabular-nums">
                                      {formatSignedCurrency(Number(value))}
                                    </span>
                                  </div>
                                )}
                              />
                            }
                          />

                          <Area
                            type="monotone"
                            dataKey="equity"
                            stroke={`var(--color-equity)`}
                            strokeWidth={2}
                            fill="url(#faEquityGradient)"
                            dot={false}
                            isAnimationActive
                          />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center rounded-2xl border bg-background/50 p-10 text-sm text-muted-foreground">
                        Add trades to see the curve.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center justify-between gap-3 text-base">
                    <span className="flex items-center gap-2">
                      <ChartCandlestick className="size-4 text-muted-foreground" />
                      Details
                    </span>
                    <Badge variant="secondary" className="rounded-full">
                      Insight
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    A closer look at wins, losses, and risk.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <DetailTile
                    label="Gross Profit"
                    value={
                      <AnimatedNumber
                        value={Number(analytics.grossProfit ?? 0)}
                        formatValue={(v) => formatSignedCurrency(v)}
                        durationMs={650}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    }
                    tone="good"
                    note="Total of winning trades"
                    icon={<TrendingUp className="size-5" />}
                    className="animate-in fade-in slide-in-from-right-2 duration-300"
                  />

                  <DetailTile
                    label="Gross Loss"
                    value={
                      <AnimatedNumber
                        value={Number(analytics.grossLoss ?? 0)}
                        formatValue={(v) => formatSignedCurrency(v)}
                        durationMs={650}
                      />
                    }
                    tone="bad"
                    note="Total of losing trades"
                    icon={<TrendingDown className="size-5" />}
                    className="animate-in fade-in slide-in-from-right-2 duration-300 delay-75"
                  />

                  <DetailTile
                    label="Avg Win"
                    value={
                      <AnimatedNumber
                        value={Number(analytics.avgWin ?? 0)}
                        formatValue={(v) => formatSignedCurrency(v)}
                        durationMs={700}
                      />
                    }
                    tone="neutral"
                    note="Average gain per win"
                    icon={<Target className="size-5" />}
                    className="animate-in fade-in slide-in-from-right-2 duration-300 delay-150"
                  />

                  <DetailTile
                    label="Avg Loss"
                    value={
                      <AnimatedNumber
                        value={Number(analytics.avgLoss ?? 0)}
                        formatValue={(v) => formatSignedCurrency(v)}
                        durationMs={700}
                      />
                    }
                    tone="neutral"
                    note="Average loss per loss"
                    icon={<ShieldAlert className="size-5" />}
                    className="animate-in fade-in slide-in-from-right-2 duration-300 delay-200"
                  />

                  <DetailTile
                    label="Expectancy"
                    value={
                      <AnimatedNumber
                        value={Number(analytics.expectancy ?? 0)}
                        formatValue={(v) => formatSignedCurrency(v)}
                        durationMs={750}
                      />
                    }
                    tone={
                      Number(analytics.expectancy ?? 0) >= 0 ? "good" : "bad"
                    }
                    note="Expected value per trade"
                    icon={<Gauge className="size-5" />}
                    className="animate-in fade-in slide-in-from-right-2 duration-300 delay-250"
                  />

                  <DetailTile
                    label="Max Drawdown"
                    value={
                      <AnimatedNumber
                        value={-Math.abs(Number(analytics.maxDrawdown ?? 0))}
                        formatValue={(v) => formatSignedCurrency(v)}
                        durationMs={800}
                      />
                    }
                    tone="bad"
                    note="Worst peak-to-trough"
                    icon={<TrendingDown className="size-5" />}
                    className="animate-in fade-in slide-in-from-right-2 duration-300 delay-300"
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Winners & losers</CardTitle>
                <CardDescription>
                  Biggest outcomes in a single trade.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="group relative overflow-hidden rounded-3xl border bg-card/60 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border/70 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-emerald-500/14 via-sky-500/10 to-purple-500/12"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Largest Win
                      </div>
                      <div className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        <AnimatedNumber
                          value={Number(analytics.largestWin ?? 0)}
                          formatValue={(v) => formatSignedCurrency(v)}
                          durationMs={750}
                        />
                      </div>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-2xl border bg-background/70 text-emerald-500">
                      <TrendingUp className="size-5" />
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border bg-card/60 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border/70 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-rose-500/14 via-orange-500/10 to-purple-500/12"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Largest Loss
                      </div>
                      <div className="text-2xl font-semibold tabular-nums">
                        <AnimatedNumber
                          value={Number(analytics.largestLoss ?? 0)}
                          formatValue={(v) => formatSignedCurrency(v)}
                          durationMs={750}
                        />
                      </div>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-2xl border bg-background/70">
                      <TrendingDown className="size-5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullAnalytics;
