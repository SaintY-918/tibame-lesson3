import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Car, CircleDot, Sparkles, Users2, Wrench, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";

interface DashboardSummary {
  cards: {
    totalVehicles: number;
    availableVehicles: number;
    maintenanceVehicles: number;
    retiredVehicles: number;
    newVehiclesThisMonth: number;
    totalEmployees?: number;
  };
  charts: {
    statusDistribution: { status: string; count: number }[];
    vehiclesByDepartment?: { department: string; count: number }[];
    vehiclesTrendLast12Months: { month: string; count: number }[];
  };
}

async function fetchSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary");
  return data;
}

interface CardConfig {
  key: keyof DashboardSummary["cards"];
  label: string;
  icon: ReactNode;
  tone: "brand" | "success" | "warning" | "destructive" | "muted";
}

const CARD_CONFIGS: CardConfig[] = [
  { key: "totalVehicles", label: "總車輛", icon: <Car className="h-4 w-4" />, tone: "brand" },
  { key: "availableVehicles", label: "可用", icon: <CircleDot className="h-4 w-4" />, tone: "success" },
  { key: "maintenanceVehicles", label: "維修中", icon: <Wrench className="h-4 w-4" />, tone: "warning" },
  { key: "retiredVehicles", label: "報廢", icon: <XCircle className="h-4 w-4" />, tone: "destructive" },
  { key: "totalEmployees", label: "員工總數", icon: <Users2 className="h-4 w-4" />, tone: "muted" },
  { key: "newVehiclesThisMonth", label: "本月新增", icon: <Sparkles className="h-4 w-4" />, tone: "brand" },
];

const TONE_STYLES: Record<CardConfig["tone"], string> = {
  brand: "bg-brand-gradient text-white shadow-glow",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  destructive: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  muted: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "可用",
  MAINTENANCE: "維修中",
  RETIRED: "報廢",
};

const PIE_COLORS = [
  "hsl(var(--brand-from))",
  "hsl(38 92% 55%)",
  "hsl(0 80% 60%)",
];

export function DashboardPage() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: fetchSummary });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="space-y-3 rounded-md border border-destructive p-4" role="alert">
        <p className="text-destructive">無法載入 dashboard 資料</p>
        <Button onClick={() => q.refetch()}>重試</Button>
      </div>
    );
  }

  const cards = q.data!.cards;
  const charts = q.data!.charts;
  const visibleConfigs = CARD_CONFIGS.filter((c) => cards[c.key] !== undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <AnimatedGradientText>車隊總覽</AnimatedGradientText>
        </h1>
        <p className="text-sm text-muted-foreground">
          即時掌握車輛狀態、員工指派與近 12 個月新增趨勢。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {visibleConfigs.map((c) => (
          <MagicCard key={c.key} className="p-0">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {c.label}
                </CardTitle>
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${TONE_STYLES[c.tone]}`}
                >
                  {c.icon}
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <NumberTicker
                  value={cards[c.key] ?? 0}
                  className="text-2xl font-bold tracking-tight"
                />
              </CardContent>
            </Card>
          </MagicCard>
        ))}
      </div>

      <div
        className={`grid gap-3 ${
          charts.vehiclesByDepartment ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        <Card className="overflow-hidden gradient-border">
          <CardHeader>
            <CardTitle className="text-base">狀態分佈</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={charts.statusDistribution.map((d) => ({
                    ...d,
                    label: STATUS_LABELS[d.status] ?? d.status,
                  }))}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {charts.statusDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {charts.vehiclesByDepartment && (
          <Card className="overflow-hidden gradient-border">
            <CardHeader>
              <CardTitle className="text-base">各部門車輛數</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <BarChart data={charts.vehiclesByDepartment}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--brand-from))" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="hsl(var(--brand-to))" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                    cursor={{ fill: "hsl(var(--brand-from) / 0.08)" }}
                  />
                  <Bar dataKey="count" fill="url(#barFill)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden gradient-border">
          <CardHeader>
            <CardTitle className="text-base">近 12 月新增趨勢</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <AreaChart data={charts.vehiclesTrendLast12Months}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand-from))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--brand-to))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--brand-from))"
                  strokeWidth={2.5}
                  fill="url(#areaFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
