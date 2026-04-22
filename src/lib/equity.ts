import { compareAsc, format, parseISO } from "date-fns";

type TradeDay = {
  date: string;
  pnl: number;
  trades: number;
};

export type EquityPoint = {
  date: string;
  equity: number;
};

export function generateEquityCurve(data: TradeDay[]) {
  const sorted = [...data].sort((a, b) =>
    compareAsc(parseISO(a.date), parseISO(b.date)),
  );

  let cumulative = 0;

  return sorted.map((day) => {
    cumulative += day.pnl;

    return {
      date: day.date,
      equity: cumulative,
    };
  });
}

export function normalizeEquityCurve(data: EquityPoint[] = []): EquityPoint[] {
  return [...data]
    .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)))
    .map((point) => ({
      date: format(parseISO(point.date), "dd MMM"),
      equity: point.equity,
    }));
}
