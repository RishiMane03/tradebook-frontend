import * as React from "react";
import {
  useForm,
  type ControllerRenderProps,
  type SubmitHandler,
} from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarIcon,
  CheckIcon,
  ChevronsUpDown,
  Hash,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 1) Type definitions
// ----------------------------------------------

export type InstrumentSymbol = "NIFTY" | "BANKNIFTY" | "BTC" | "ETH" | "AAPL";

export type TradeDirection = "LONG" | "SHORT";

export interface TradeEntryFormValues {
  instrument: InstrumentSymbol;
  direction: TradeDirection;
  quantity: number; // required, > 0
  pnl: number | null; // optional, positive or negative
  note: string; // optional text
  date: Date; // required date
}

const INSTRUMENT_OPTIONS: { label: string; value: InstrumentSymbol }[] = [
  { label: "Nifty", value: "NIFTY" },
  { label: "BankNifty", value: "BANKNIFTY" },
  { label: "Bitcoin (BTC)", value: "BTC" },
  { label: "Ethereum (ETH)", value: "ETH" },
  { label: "Apple (AAPL)", value: "AAPL" },
];

// Combobox for searchable instrument selection
interface InstrumentComboboxProps {
  field: ControllerRenderProps<TradeEntryFormValues, "instrument">;
}

const InstrumentCombobox: React.FC<InstrumentComboboxProps> = ({ field }) => {
  const [open, setOpen] = useState(false);

  const selected = INSTRUMENT_OPTIONS.find(
    (instrument) => instrument.value === field.value,
  );

  const selectedLabel = selected?.label ?? "Select instrument";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "truncate",
                !field.value && "text-muted-foreground",
              )}
            >
              {selectedLabel}
            </span>
            {field.value ? (
              <Badge
                variant="secondary"
                className="hidden shrink-0 sm:inline-flex"
              >
                {field.value}
              </Badge>
            ) : null}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search instrument..." />
          <CommandEmpty>No instrument found.</CommandEmpty>
          <CommandGroup>
            {INSTRUMENT_OPTIONS.map((instrument) => (
              <CommandItem
                key={instrument.value}
                value={instrument.label}
                onSelect={() => {
                  field.onChange(instrument.value);
                  setOpen(false);
                }}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    instrument.value === field.value
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">{instrument.label}</span>
                  <Badge variant="outline" className="shrink-0">
                    {instrument.value}
                  </Badge>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// 2) useForm setup with default values
// ----------------------------------------------

export const TradeEntry: React.FC = () => {
  const { strategyId } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const form = useForm<TradeEntryFormValues>({
    mode: "onChange",
    defaultValues: {
      instrument: "NIFTY",
      direction: "LONG",
      quantity: 65,
      pnl: null,
      note: "",
      date: new Date(),
    },
  });

  const watched = form.watch();
  const selectedInstrument = INSTRUMENT_OPTIONS.find(
    (option) => option.value === watched.instrument,
  );
  const pnlNumber =
    watched.pnl === null || !Number.isFinite(watched.pnl) ? null : watched.pnl;
  const pnlTone =
    pnlNumber === null
      ? "text-muted-foreground"
      : pnlNumber >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";

  // 5) Submit handler with properly typed form data
  // ----------------------------------------------
  const onSubmit: SubmitHandler<TradeEntryFormValues> = async (values) => {
    const normalizedDate = new Date(
      Date.UTC(
        values.date.getFullYear(),
        values.date.getMonth(),
        values.date.getDate(),
      ),
    );

    try {
      setIsLoading(true);
      await api.post(`/trades/${strategyId}`, {
        ...values,
        date: normalizedDate,
        notes: values.note,
      });
      form.reset();
      navigate(`/trade-list/${strategyId}`);
    } catch (error) {
      console.error("Error saving trade entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 4) UI implementation using shadcn Form components
  // ----------------------------------------------
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-2xl" />

        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">
                New Trade Entry
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Store your trades for analysis, review, and iteration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {strategyId ? (
              <Badge variant="outline" className="hidden sm:inline-flex">
                Strategy: {strategyId}
              </Badge>
            ) : null}
            <Badge
              variant={form.formState.isValid ? "secondary" : "outline"}
              className={cn(
                "hidden sm:inline-flex",
                form.formState.isValid &&
                  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              )}
            >
              {form.formState.isValid ? "Ready" : "Draft"}
            </Badge>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[1fr_320px] md:items-start">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Trade details</span>
                <span className="text-muted-foreground text-sm font-normal">
                  {watched.date ? format(watched.date, "PPP") : null}
                </span>
              </CardTitle>
              <CardDescription>
                Fill the essentials first, the preview updates live.
              </CardDescription>
            </CardHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-medium text-foreground">
                        Basics
                      </h2>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Required
                      </Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Date: date picker (Calendar + Popover) */}
                      <FormField
                        control={form.control}
                        name="date"
                        rules={{
                          required: "Date is required.",
                        }}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Select a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                                sideOffset={4}
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(day) =>
                                    field.onChange(day ?? field.value)
                                  }
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("2000-01-01")
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="px-2"
                                onClick={() => field.onChange(new Date())}
                              >
                                Today
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="px-2"
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() - 1);
                                  field.onChange(d);
                                }}
                              >
                                Yesterday
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Instrument: searchable dropdown (Combobox) */}
                      <FormField
                        control={form.control}
                        name="instrument"
                        rules={{ required: "Instrument is required." }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instrument</FormLabel>
                            <FormControl>
                              <InstrumentCombobox field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Direction: Long / Short toggle */}
                      <FormField
                        control={form.control}
                        name="direction"
                        rules={{ required: "Direction is required." }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Direction</FormLabel>
                            <FormControl>
                              <ToggleGroup
                                type="single"
                                value={field.value}
                                onValueChange={(value) => {
                                  if (value)
                                    field.onChange(value as TradeDirection);
                                }}
                                className="grid w-full grid-cols-1 sm:grid-cols-2"
                                variant="outline"
                                size="sm"
                              >
                                <ToggleGroupItem
                                  value="LONG"
                                  className="justify-center data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-700 dark:data-[state=on]:text-emerald-400"
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                  Long
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="SHORT"
                                  className="justify-center data-[state=on]:bg-rose-500/10 data-[state=on]:text-rose-700 dark:data-[state=on]:text-rose-400"
                                >
                                  <ArrowDownRight className="h-4 w-4" />
                                  Short
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity: required number > 0 */}
                      <FormField
                        control={form.control}
                        name="quantity"
                        rules={{
                          required: "Quantity is required.",
                          min: {
                            value: 1,
                            message: "Quantity must be greater than 0.",
                          },
                          validate: (value) =>
                            Number.isFinite(value) && value > 0
                              ? true
                              : "Quantity must be a positive number.",
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <InputGroup>
                                <InputGroupAddon>
                                  <Hash className="h-4 w-4" />
                                  Qty
                                </InputGroupAddon>
                                <InputGroupInput
                                  type="number"
                                  min={1}
                                  step={1}
                                  {...field}
                                  value={
                                    Number.isNaN(field.value) ? "" : field.value
                                  }
                                  onChange={(event) => {
                                    const parsed = event.target.valueAsNumber;
                                    field.onChange(
                                      Number.isNaN(parsed) ? NaN : parsed,
                                    );
                                  }}
                                  inputMode="numeric"
                                  aria-invalid={
                                    !!form.formState.errors.quantity
                                  }
                                  aria-describedby="quantity-error"
                                />
                              </InputGroup>
                            </FormControl>
                            <FormMessage id="quantity-error" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* PnL: number, positive or negative (optional) */}
                  <FormField
                    control={form.control}
                    name="pnl"
                    rules={{
                      validate: (value) =>
                        value === null || Number.isFinite(value)
                          ? true
                          : "PnL must be a valid number.",
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between gap-3">
                          <span>PnL</span>
                          <span className={cn("text-xs font-normal", pnlTone)}>
                            {pnlNumber === null
                              ? "No value"
                              : pnlNumber >= 0
                                ? "Profit"
                                : "Loss"}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={
                              field.value === null || Number.isNaN(field.value)
                                ? ""
                                : field.value
                            }
                            onChange={(event) => {
                              const raw = event.target.value;
                              if (raw === "") {
                                field.onChange(null);
                                return;
                              }
                              const parsed = event.target.valueAsNumber;
                              field.onChange(
                                Number.isNaN(parsed) ? NaN : parsed,
                              );
                            }}
                            inputMode="decimal"
                            aria-invalid={!!form.formState.errors.pnl}
                            aria-describedby="pnl-error"
                            className={cn(
                              pnlNumber === null
                                ? ""
                                : pnlNumber >= 0
                                  ? "border-emerald-500/40 focus-visible:ring-emerald-500/20"
                                  : "border-rose-500/40 focus-visible:ring-rose-500/20",
                            )}
                          />
                        </FormControl>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Use negative values for losses, positive for profits.
                        </p>
                        <FormMessage id="pnl-error" />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4 mb-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-medium text-foreground">
                        Outcome
                      </h2>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Optional
                      </Badge>
                    </div>

                    {/* Note: textarea (optional) */}
                    <FormField
                      control={form.control}
                      name="note"
                      rules={{
                        maxLength: {
                          value: 1000,
                          message: "Note must be at most 1000 characters.",
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Optional trade notes, setup, rationale, etc."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>

                <CardFooter className="border-t justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isLoading || form.formState.isSubmitting}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      form.formState.isSubmitting ||
                      !form.formState.isValid
                    }
                  >
                    {isLoading ? (
                      <Spinner />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save trade
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          <Card className="md:sticky md:top-6">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>What will be saved.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {selectedInstrument?.label ?? watched.instrument}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    watched.direction === "LONG"
                      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                      : "border-rose-500/40 text-rose-700 dark:text-rose-400",
                  )}
                >
                  {watched.direction === "LONG" ? "Long" : "Short"}
                </Badge>
                <Badge variant="outline">
                  Qty:{" "}
                  {Number.isFinite(watched.quantity) ? watched.quantity : "—"}
                </Badge>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {watched.date ? format(watched.date, "PPP") : "—"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">PnL</span>
                  <span className={cn("font-medium tabular-nums", pnlTone)}>
                    {pnlNumber === null ? "—" : pnlNumber.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="text-muted-foreground text-xs">
                    {watched.note?.length ?? 0}/1000
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {watched.note?.trim()
                    ? watched.note
                    : "Add a quick summary: setup, mistakes, and what to improve next time."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradeEntry;
