import StrategyList from "@/components/home/StrategyList";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { BookOpen, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Strategy = {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  createdAt?: string;
};

const Home: React.FC = () => {
  const [listOfTradeBooks, setListOfTradeBooks] = useState<Strategy[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [strategyName, setStrategyName] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(
    null,
  );
  const [isFetchingStrategies, setIsFetchingStrategies] =
    useState<boolean>(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const openCreateDialog = () => {
    setEditingStrategyId(null);
    setStrategyName("");
    setStrategyDescription("");
    setIsCreateDialogOpen(true);
  };

  const fetchStrategies = async () => {
    try {
      setIsFetchingStrategies(true);
      const response = await api.get("/strategies/get-strategies");
      console.log("Fetched Strategies Response:", response);
      setListOfTradeBooks(response.data);
    } catch (error) {
      console.error("Error fetching strategies:", error);
    } finally {
      setIsFetchingStrategies(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleStrategySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSavingStrategy(true);
      if (editingStrategyId) {
        await api.put(`/strategies/${editingStrategyId}`, {
          name: strategyName,
          description: strategyDescription,
        });
      } else {
        const newStrategy: Strategy = {
          name: strategyName,
          description: strategyDescription,
        };

        const response = await api.post(
          "/strategies/create-strategy",
          newStrategy,
        );
        console.log("Created Strategy Response:", response);
        setListOfTradeBooks((prev) => [...prev, response.data]);
      }

      await fetchStrategies(); // Refresh the list after creating/updating a strategy
    } catch (error) {
      console.error("Error saving strategy:", error);
    } finally {
      setIsSavingStrategy(false);
    }

    setStrategyName("");
    setStrategyDescription("");
    setEditingStrategyId(null);
    setIsCreateDialogOpen(false);
  };

  const handleEditStrategy = (strategy: Strategy) => {
    const id = strategy.id ?? strategy._id;
    if (!id) return;

    setEditingStrategyId(id);
    setStrategyName(strategy.name);
    setStrategyDescription(strategy.description);
    setIsCreateDialogOpen(true);
  };

  const filteredStrategies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return listOfTradeBooks;
    return listOfTradeBooks.filter((strategy) =>
      [strategy.name, strategy.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [listOfTradeBooks, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <StripedPattern className="[mask-image:radial-gradient(300px_circle_at_center,white,transparent)] opacity-20" />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Trade books
              </h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3.5" />
                Organize your playbooks
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Create strategies, track performance, and keep your process
              repeatable.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFetchingStrategies && listOfTradeBooks.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Syncing…
              </div>
            )}
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="size-4" />
              New strategy
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-muted-foreground" />
              Your strategies
            </CardTitle>
            <CardDescription>
              Click a strategy to open its dashboard, or edit details anytime.
            </CardDescription>
            <CardAction className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              <div className="relative w-full sm:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search strategies…"
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">
                  {filteredStrategies.length}/{listOfTradeBooks.length}
                </Badge>
                matching
              </div>
            </CardAction>
          </CardHeader>

          <CardContent className="pt-6">
            {isFetchingStrategies && listOfTradeBooks.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : listOfTradeBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full border bg-muted/40">
                  <BookOpen className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    Create your first trade book
                  </h2>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    A trade book is a collection of strategies and trades. Keep
                    notes tight, review often, and iterate with intention.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={openCreateDialog} className="gap-2">
                    <Plus className="size-4" />
                    Create strategy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchStrategies}
                    disabled={isFetchingStrategies}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="max-h-[65vh] pr-3">
                <StrategyList
                  listOfStrategies={filteredStrategies}
                  onEditStrategy={handleEditStrategy}
                  fetchStrategies={fetchStrategies}
                />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingStrategyId
                ? "Update strategy"
                : "Add Strategy to your trade book"}
            </DialogTitle>
            {!editingStrategyId && (
              <DialogDescription>
                This will create a new strategy tab to help you track your
                performance and analyze your trades.
              </DialogDescription>
            )}
          </DialogHeader>

          <form
            className="flex flex-col gap-4 mt-4"
            onSubmit={handleStrategySubmit}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="strategyName" className="gap-0">
                Strategy name<span className="text-red-400 ml-0">*</span>
              </Label>
              <Input
                id="strategyName"
                value={strategyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStrategyName(e.target.value)
                }
                placeholder="e.g. Nifty Opening Range Breakout"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="strategyDescription">Short description</Label>
              <Textarea
                id="strategyDescription"
                value={strategyDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setStrategyDescription(e.target.value)
                }
                placeholder="Describe the core idea of the strategy in 1–2 lines."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSavingStrategy}
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingStrategyId(null);
                  setStrategyName("");
                  setStrategyDescription("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingStrategy}>
                {isSavingStrategy ? (
                  <>
                    <Spinner className="mr-2" />
                    Saving…
                  </>
                ) : editingStrategyId ? (
                  "Update strategy"
                ) : (
                  "Save strategy"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
