import { Card } from "@/components/ui/card";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useMemo, useState } from "react";

type Props = {
  data: {
    date: string;
    pnl: number;
    trades: number;
  }[];
};

const formatPnl = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export function TradeCalendar({ data }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate full grid (always 6 rows)
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getStats = (day: Date) =>
    data.find((d) => d.date === format(day, "yyyy-MM-dd"));

  const totalPnl = useMemo(
    () => data.reduce((acc, d) => acc + d.pnl, 0),
    [data],
  );

  const totalTrades = useMemo(
    () => data.reduce((acc, d) => acc + d.trades, 0),
    [data],
  );

  return (
    <Card className="p-6 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-3 items-center mb-1">
        {/* Left Arrow */}
        <div className="flex justify-start">
          <ChevronLeft
            className="cursor-pointer"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          />
        </div>

        {/* Center Month */}
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>

        {/* Right Arrow */}
        <div className="flex justify-end">
          <ChevronRight
            className="cursor-pointer"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />
        </div>
      </div>

      <div className="flex items-center justify-end mb-1">
        <div className="flex gap-6 text-sm">
          <span>
            P/L:{" "}
            <span
              className={`font-semibold ${
                totalPnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatPnl(totalPnl)}
            </span>
          </span>
          <span>Trades: {totalTrades}</span>
        </div>
      </div>

      {/* Week Labels */}
      <div className="grid grid-cols-8 text-sm text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
        <div className="text-center font-medium">Weekly PnL</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: days.length / 7 }).map((_, weekIndex) => {
          const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);

          // Weekly PnL calculation
          const weekPnl = weekDays.reduce((acc, day) => {
            const stats = getStats(day);
            return acc + (stats?.pnl || 0);
          }, 0);

          return (
            <React.Fragment key={weekIndex}>
              {/* 7 Day Cells */}
              {weekDays.map((day, i) => {
                const stats = getStats(day);
                const isCurrent = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={`${weekIndex}-${i}`}
                    className={`
                h-20 rounded-xl p-3 border transform transition-all duration-200
                hover:shadow-md hover:scale-[1.02]
                ${!isCurrent && "opacity-30"}
                ${isToday(day) && "ring-2 ring-primary"}
                ${stats?.pnl && stats.pnl > 0 && "bg-green-100/60"}
                ${stats?.pnl && stats.pnl < 0 && "bg-red-100/60"}
              `}
                  >
                    <div className="text-sm font-medium text-right">
                      {format(day, "d")}
                    </div>

                    {stats && (
                      <div className="text-center">
                        <div
                          className={`text-sm font-semibold ${
                            stats.pnl > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {/* {stats.trades} */}
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            stats.pnl > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatPnl(stats.pnl)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Weekly Summary Column */}
              <div
                className={`
            h-20 rounded-xl p-3 border flex flex-col justify-center items-center transform transition-all duration-200
            hover:shadow-md hover:scale-[1.02]
            ${weekPnl > 0 && "bg-green-100/60"}
            ${weekPnl < 0 && "bg-red-100/60"}
          `}
              >
                <div
                  className={`font-semibold ${
                    weekPnl > 0
                      ? "text-green-600"
                      : weekPnl < 0
                        ? "text-red-600"
                        : ""
                  }`}
                >
                  {formatPnl(weekPnl)}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}
