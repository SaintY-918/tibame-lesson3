import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createVehicleSchema,
  type CreateVehicleInput,
  VEHICLE_STATUSES,
  type VehicleStatus,
} from "@vms/shared";
import { ApiError, apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VehicleRow {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: VehicleStatus;
  mileage: number;
  purchasedAt: string;
  ownerId: string | null;
}

interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function VehiclesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | VehicleStatus>("ALL");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search, 300);

  const list = useQuery({
    queryKey: ["vehicles", { search: debounced, status, page }],
    queryFn: async () => {
      const { data } = await apiClient.get<Page<VehicleRow>>("/vehicles", {
        params: { search: debounced || undefined, status, page, pageSize: 20 },
      });
      return data;
    },
  });

  const [editing, setEditing] = useState<VehicleRow | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VehicleRow | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/vehicles/${id}`),
    onSuccess: () => {
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="search">搜尋</Label>
          <Input
            id="search"
            placeholder="車牌 / 廠牌 / 車型"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Label>狀態</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "ALL" | VehicleStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部</SelectItem>
              {VEHICLE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        {isAdmin && <Button onClick={() => setEditing("new")}>新增車輛</Button>}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>車牌</TableHead>
              <TableHead>廠牌</TableHead>
              <TableHead>車型</TableHead>
              <TableHead>年份</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">里程</TableHead>
              <TableHead>購買日</TableHead>
              <TableHead>負責員工</TableHead>
              {isAdmin && <TableHead className="text-right">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data?.items.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.plate}</TableCell>
                <TableCell>{v.make}</TableCell>
                <TableCell>{v.model}</TableCell>
                <TableCell>{v.year}</TableCell>
                <TableCell>{v.status}</TableCell>
                <TableCell className="text-right">{v.mileage.toLocaleString()}</TableCell>
                <TableCell>{v.purchasedAt.slice(0, 10)}</TableCell>
                <TableCell>{v.ownerId ?? "—"}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(v)}>
                      編輯
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setConfirmDelete(v)}
                    >
                      刪除
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {list.data && list.data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="text-center text-muted-foreground py-8">
                  尚無車輛
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {list.data && (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一頁
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {list.data.page} / {list.data.totalPages} 頁
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= list.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一頁
          </Button>
        </div>
      )}

      {isAdmin && editing !== null && (
        <VehicleSheet
          editing={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["vehicles"] });
          }}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              即將刪除車輛 {confirmDelete?.plate}，此動作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VehicleSheet({
  editing,
  onClose,
  onSuccess,
}: {
  editing: VehicleRow | "new";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isNew = editing === "new";
  const defaultValues = useMemo<Partial<CreateVehicleInput>>(() => {
    if (isNew)
      return {
        status: "AVAILABLE",
        year: new Date().getFullYear(),
        mileage: 0,
      };
    const v = editing as VehicleRow;
    return {
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      status: v.status,
      mileage: v.mileage,
      purchasedAt: new Date(v.purchasedAt),
      ownerId: v.ownerId ?? undefined,
    };
  }, [editing, isNew]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues,
  });

  const submit = handleSubmit(async (values) => {
    try {
      if (isNew) {
        await apiClient.post("/vehicles", values);
      } else {
        await apiClient.patch(`/vehicles/${(editing as VehicleRow).id}`, values);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError("root", { message: err.message });
      }
    }
  });

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="max-w-2xl">
        <SheetHeader>
          <SheetTitle>{isNew ? "新增車輛" : `編輯 ${(editing as VehicleRow).plate}`}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          {(
            [
              { name: "plate", label: "車牌", type: "text" },
              { name: "make", label: "廠牌", type: "text" },
              { name: "model", label: "車型", type: "text" },
              { name: "year", label: "年份", type: "number" },
              { name: "color", label: "顏色", type: "text" },
              { name: "mileage", label: "里程數", type: "number" },
              { name: "purchasedAt", label: "購買日期", type: "date" },
              { name: "ownerId", label: "負責員工 id（可留空）", type: "text" },
            ] as const
          ).map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input
                id={f.name}
                type={f.type}
                {...register(f.name as "plate", {
                  valueAsNumber: f.type === "number",
                })}
              />
              {errors[f.name as keyof CreateVehicleInput] && (
                <p className="text-xs text-destructive">
                  {(errors[f.name as keyof CreateVehicleInput] as { message?: string })?.message}
                </p>
              )}
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="status">狀態</Label>
            <select
              id="status"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("status")}
            >
              {VEHICLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {errors.root && (
            <p className="col-span-2 text-sm text-destructive">{errors.root.message}</p>
          )}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isNew ? "新增" : "儲存"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
