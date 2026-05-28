import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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

const CARD_LABELS: Record<keyof DashboardSummary["cards"], string> = {
  totalVehicles: "總車輛",
  availableVehicles: "可用",
  maintenanceVehicles: "維修中",
  retiredVehicles: "報廢",
  newVehiclesThisMonth: "本月新增",
  totalEmployees: "員工總數",
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export function DashboardPage() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: fetchSummary });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-md border border-destructive p-4 space-y-3" role="alert">
        <p className="text-destructive">無法載入 dashboard 資料</p>
        <Button onClick={() => q.refetch()}>重試</Button>
      </div>
    );
  }

  const cards = q.data!.cards;
  const charts = q.data!.charts;
  const cardKeys = (
    [
      "totalVehicles",
      "availableVehicles",
      "maintenanceVehicles",
      "retiredVehicles",
      "totalEmployees",
      "newVehiclesThisMonth",
    ] as const
  ).filter((k) => cards[k] !== undefined);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cardKeys.map((k) => (
          <Card key={k}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {CARD_LABELS[k]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{cards[k]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className={`grid gap-3 ${
          charts.vehiclesByDepartment ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        <Card>
          <CardHeader>
            <CardTitle>狀態分佈</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={charts.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={40}
                  outerRadius={80}
                >
                  {charts.statusDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {charts.vehiclesByDepartment && (
          <Card>
            <CardHeader>
              <CardTitle>各部門車輛數</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer>
                <BarChart data={charts.vehiclesByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>近 12 月新增趨勢</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={charts.vehiclesTrendLast12Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
