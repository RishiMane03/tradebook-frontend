import api from "@/lib/api";
import { Edit2, Trash2Icon } from "lucide-react";
import { useState } from "react";
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
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { useNavigate } from "react-router-dom";

type Strategy = {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  createdAt?: string;
};

const StrategyList = ({
  listOfStrategies,
  onEditStrategy,
  fetchStrategies,
}: {
  listOfStrategies: Strategy[];
  onEditStrategy: (strategy: Strategy) => void;
  fetchStrategies: () => void;
}) => {
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [deletingStrategyId, setDeletingStrategyId] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();

  const handleEditClick = (strategy: Strategy) => {
    onEditStrategy(strategy);
  };

  const handleDelete = async (strategy: Strategy) => {
    const id = strategy._id ?? strategy.id;
    if (!id) return;

    setIsApiLoading(true);
    setDeletingStrategyId(id);
    try {
      await api.delete(`/strategies/${id}`);
      fetchStrategies();
    } catch (error) {
      console.log("Error deleting strategy ", error);
    } finally {
      setIsApiLoading(false);
      setDeletingStrategyId(null);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-3">
        {listOfStrategies.map((strategy, index) => {
          const id = strategy._id ?? strategy.id;
          const canNavigate = Boolean(id);
          return (
            <div
              key={id ?? `${strategy.name}-${index}`}
              className="group rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="tabular-nums">
                      #{index + 1}
                    </Badge>
                    <button
                      type="button"
                      className="cursor-pointer truncate text-left text-lg font-semibold capitalize leading-tight transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canNavigate}
                      onClick={() => {
                        if (!id) return;
                        navigate(`/dashboard/${id}`);
                      }}
                      title={strategy.name}
                    >
                      {strategy.name}
                    </button>
                  </div>
                  {strategy.description?.trim() ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {strategy.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/70">
                      No description yet.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isApiLoading}
                    onClick={() => handleEditClick(strategy)}
                    className="h-9"
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isApiLoading || !id}
                        className="h-9 bg-rose-500"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                          <Trash2Icon />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Delete strategy?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this strategy.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel variant="outline">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant={isApiLoading ? "outline" : "destructive"}
                          disabled={isApiLoading || !id}
                          onClick={() => handleDelete(strategy)}
                          className={isApiLoading ? "border-rose-400" : ""}
                        >
                          {deletingStrategyId === id ? (
                            <>
                              <Spinner />
                              Deleting…
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StrategyList;
