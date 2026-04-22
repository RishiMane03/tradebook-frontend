import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { Edit2Icon, Trash2, TrendingDown, TrendingUp } from "lucide-react";
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

const formatPnl = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const TradeList = () => {
  const [tradeData, setTradeData] = useState<TradesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [updatingTrade, setUpdatingTrade] = useState(false);
  const [deletingTrade, setDeletingTrade] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [editTradeForm, setEditTradeForm] = useState({
    date: "",
    instrument: "",
    direction: "LONG" as "LONG" | "SHORT",
    quantity: "",
    pnl: "",
    note: "",
  });
  const { strategyId } = useParams<{ strategyId: string }>();

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

  const handleEditClick = (trade: Trade) => {
    const parsedDate = new Date(trade.date);
    const isoDate = Number.isNaN(parsedDate.getTime())
      ? ""
      : parsedDate.toISOString().split("T")[0];

    setEditingTradeId(trade._id);
    setEditTradeForm({
      date: isoDate,
      instrument: trade.instrument,
      direction: trade.direction,
      quantity: String(trade.quantity),
      pnl: String(trade.pnl),
      note: trade.notes ?? trade.note ?? "",
    });
    setIsEditDialogOpen(true);
  };

  const totalPnl =
    tradeData?.trades.reduce((acc, trade) => acc + trade.pnl, 0) ?? 0;

  const handleEditInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setEditTradeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateTrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTradeId) return;

    try {
      setUpdatingTrade(true);
      await api.put(`/trades/update/${editingTradeId}`, {
        date: editTradeForm.date ? new Date(editTradeForm.date) : null,
        instrument: editTradeForm.instrument,
        direction: editTradeForm.direction,
        quantity: Number(editTradeForm.quantity),
        pnl: Number(editTradeForm.pnl),
        note: editTradeForm.note,
        notes: editTradeForm.note,
      });

      await getTrades();
      setIsEditDialogOpen(false);
      setEditingTradeId(null);
    } catch (error) {
      console.error("Error updating trade:", error);
    } finally {
      setUpdatingTrade(false);
    }
  };

  const handleDeleteClick = (tradeId: string) => {
    setDeletingTradeId(tradeId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteTrade = async () => {
    if (!deletingTradeId) return;

    try {
      setDeletingTrade(true);
      await api.delete(`/trades/delete/${deletingTradeId}`);
      await getTrades();
      setIsDeleteDialogOpen(false);
      setDeletingTradeId(null);
    } catch (error) {
      console.error("Error deleting trade:", error);
    } finally {
      setDeletingTrade(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl capitalize">
                Trade History
              </CardTitle>
              <CardDescription>
                Track, edit, and review your trades for this {" "}
                <span className="font-medium text-foreground">
                  {tradeData?.strategy?.name ?? "strategy"}
                </span>{" "}
              </CardDescription>
            </div>

            <div className="flex items-baseline justify-between sm:justify-end gap-3">
              <div className="text-sm text-muted-foreground">Total P/L</div>
              <div
                className={
                  totalPnl < 0
                    ? "text-red-500 font-semibold tabular-nums"
                    : "text-green-600 font-semibold tabular-nums"
                }
              >
                {totalPnl >= 0
                  ? `+₹${formatPnl(totalPnl)}`
                  : `-₹${formatPnl(Math.abs(totalPnl))}`}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-[70vh] overflow-auto">
              <Table className="table-fixed [&_th]:text-muted-foreground">
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
                  <TableRow className="[&_th]:h-11">
                    <TableHead className="w-22.5 text-center">
                      Sr. No.
                    </TableHead>
                    <TableHead className="w-40 text-center">Date</TableHead>
                    <TableHead className="w-35 text-center">
                      Instrument
                    </TableHead>
                    <TableHead className="w-35 text-center">
                      Direction
                    </TableHead>
                    <TableHead className="w-30 text-center">Quantity</TableHead>
                    <TableHead className="w-35 text-center">PnL</TableHead>
                    <TableHead className="w-30 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Spinner />
                          Getting trades...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (tradeData?.trades?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10">
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                          No trades found for this strategy.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tradeData?.trades?.map((trade, index) => (
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

                        <TableCell className="font-medium text-center">
                          {trade.instrument}
                        </TableCell>
                        <TableCell className="text-center">
                          {trade.direction === "LONG" ? (
                            <Badge
                              variant="secondary"
                              className="bg-zinc-500/10 text-zinc-700 dark:text-zinc-400"
                            >
                              <TrendingUp />
                              LONG
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                            >
                              <TrendingDown />
                              SHORT
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center tabular-nums">
                          {trade.quantity}
                        </TableCell>
                        <TableCell
                          className={`text-center tabular-nums ${
                            trade.pnl < 0 ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          {trade.pnl > 0
                            ? `+${formatPnl(trade.pnl)}`
                            : formatPnl(trade.pnl)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex gap-2 items-center justify-center">
                            <Button
                              variant="ghost"
                              className="border hover:bg-gray-500/10 focus:ring-gray-500/50"
                              onClick={() => handleEditClick(trade)}
                              aria-label="Edit trade"
                              title="Edit"
                            >
                              <Edit2Icon />
                            </Button>
                            <Button
                              variant="ghost"
                              className="border border-red-500/55 text-red-400 hover:bg-red-500/10 focus:ring-red-500/50 hover:text-red-500"
                              onClick={() => handleDeleteClick(trade._id)}
                              aria-label="Delete trade"
                              title="Delete"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update trade</DialogTitle>
            <DialogDescription>
              Edit trade details and save changes
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateTrade} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                name="date"
                value={editTradeForm.date}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instrument">Instrument</Label>
              <Input
                id="edit-instrument"
                name="instrument"
                value={editTradeForm.instrument}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-direction">Direction</Label>
              <select
                id="edit-direction"
                name="direction"
                value={editTradeForm.direction}
                onChange={handleEditInputChange}
                className="w-full border rounded-md px-3 py-2 bg-transparent text-sm"
                required
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                name="quantity"
                min={1}
                step={1}
                value={editTradeForm.quantity}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pnl">PnL</Label>
              <Input
                id="edit-pnl"
                type="number"
                name="pnl"
                value={editTradeForm.pnl}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note">Note</Label>
              <Textarea
                id="edit-note"
                name="note"
                value={editTradeForm.note}
                onChange={handleEditInputChange}
                placeholder="Add a note about this trade (optional)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingTrade}>
                {updatingTrade ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the trade from your list. You cannot undo
              this change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              onClick={() => setDeletingTradeId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={deletingTrade ? "outline" : "destructive"}
              disabled={deletingTrade || !deletingTradeId}
              onClick={handleConfirmDeleteTrade}
            >
              {deletingTrade ? <Spinner /> : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TradeList;
