import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Trade = {
  _id: string;
  date: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  quantity: number;
  pnl: number;
  note?: string;
  notes?: string;
};

type TradesResponse = {
  strategy: {
    _id: string;
    name: string;
    description: string;
    createdAt: string;
  };
  trades: Trade[];
};

const Notes = () => {
  const [tradeData, setTradeData] = useState<TradesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { strategyId } = useParams<{ strategyId: string }>();

  const tradesWithNotes = (tradeData?.trades ?? [])
    .filter((trade) => (trade.notes ?? trade.note ?? "").trim().length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getTrades = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/trades/${strategyId}`);
      setTradeData(response.data);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getTrades();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Learnings</CardTitle>
          <CardDescription>
            Notes captured from your{" "}
            <span className="font-medium text-foreground">
              {tradeData?.strategy?.name ?? "strategy"}
            </span>{" "}
            trades
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh] gap-2 text-sm text-muted-foreground">
              <Spinner />
              Getting notes...
            </div>
          ) : tradesWithNotes.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border bg-muted/20 min-h-[40vh] text-sm text-muted-foreground">
              No notes yet. Add notes to trades to see them here.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-[70vh] overflow-auto">
                <Table className="[&_th]:text-muted-foreground">
                  <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
                    <TableRow className="[&_th]:h-11">
                      <TableHead className="w-22.5 text-center">
                        Sr. No.
                      </TableHead>
                      <TableHead className="w-40 text-center">Date</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradesWithNotes.map((trade, index) => (
                      <TableRow key={trade._id} className="odd:bg-muted/20">
                        <TableCell className="text-center tabular-nums">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {new Date(trade.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap wrap-break-words text-left">
                          {trade.notes ?? trade.note}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notes;
