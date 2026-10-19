import type { StockMovement } from "@/types/product";

export type HistoryFilter = "all" | StockMovement["type"];
export type HistoryPeriod = "day" | "week" | "month" | "year";
