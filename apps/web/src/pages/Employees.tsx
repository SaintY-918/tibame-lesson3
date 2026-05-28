import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEmployeeSchema,
  resetPasswordSchema,
  type CreateEmployeeInput,
  type ResetPasswordInput,
  EMPLOYEE_STATUSES,
  type EmployeeStatus,
  ROLES,
  type Role,
} from "@vms/shared";
import { ApiError, apiClient } from "@/lib/api";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmployeeRow {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hiredAt: string;
  phone: string;
  status: EmployeeStatus;
  username: string;
  role: Role;
}

interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<"ALL" | EmployeeStatus>("ACTIVE");
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey: ["employees", { search, department, status, page }],
    queryFn: async () => {
      const { data } = await apiClient.get<Page<EmployeeRow>>("/employees", {
        params: {
          search: search || undefined,
          department: department || undefined,
          status,
          page,
          pageSize: 20,
        },
      });
      return data;
    },
  });

  const [editing, setEditing] = useState<EmployeeRow | "new" | null>(null);
  const [resetting, setResetting] = useState<EmployeeRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="search">搜尋</Label>
          <Input
            id="search"
            placeholder="姓名 / 工號 / Email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Label htmlFor="dept">部門</Label>
          <Input
            id="dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Label>狀態</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "ALL" | EmployeeStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">在職</SelectItem>
              <SelectItem value="INACTIVE">離職</SelectItem>
              <SelectItem value="ALL">全部</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button onClick={() => setEditing("new")}>新增員工</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>工號</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>部門</TableHead>
              <TableHead>職位</TableHead>
              <TableHead>入職日</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>角色</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data?.items.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.employeeNo}</TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell>{e.email}</TableCell>
                <TableCell>{e.department}</TableCell>
                <TableCell>{e.position}</TableCell>
                <TableCell>{e.hiredAt.slice(0, 10)}</TableCell>
                <TableCell>{e.status}</TableCell>
                <TableCell>{e.role}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                    編輯
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setResetting(e)}>
                    重設密碼
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {list.data && list.data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  尚無員工
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

      {editing !== null && (
        <EmployeeSheet
          editing={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["employees"] });
          }}
        />
      )}

      {resetting && (
        <ResetPasswordDialog
          employee={resetting}
          onClose={() => setResetting(null)}
        />
      )}
    </div>
  );
}

function EmployeeSheet({
  editing,
  onClose,
  onSuccess,
}: {
  editing: EmployeeRow | "new";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isNew = editing === "new";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateEmployeeInput>({
    resolver: isNew ? zodResolver(createEmployeeSchema) : undefined,
    defaultValues: isNew
      ? { role: "USER", status: "ACTIVE" }
      : {
          employeeNo: (editing as EmployeeRow).employeeNo,
          name: (editing as EmployeeRow).name,
          email: (editing as EmployeeRow).email,
          department: (editing as EmployeeRow).department,
          position: (editing as EmployeeRow).position,
          hiredAt: new Date((editing as EmployeeRow).hiredAt),
          phone: (editing as EmployeeRow).phone,
          username: (editing as EmployeeRow).username,
          role: (editing as EmployeeRow).role,
          status: (editing as EmployeeRow).status,
        },
  });

  const submit = handleSubmit(async (values) => {
    try {
      if (isNew) {
        await apiClient.post("/employees", values);
      } else {
        const { initialPassword: _ip, ...rest } = values;
        await apiClient.patch(`/employees/${(editing as EmployeeRow).id}`, rest);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) setError("root", { message: err.message });
    }
  });

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="max-w-2xl">
        <SheetHeader>
          <SheetTitle>{isNew ? "新增員工" : `編輯 ${(editing as EmployeeRow).name}`}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          {(
            [
              { name: "employeeNo", label: "員工編號", type: "text" },
              { name: "name", label: "姓名", type: "text" },
              { name: "email", label: "Email", type: "email" },
              { name: "department", label: "部門", type: "text" },
              { name: "position", label: "職位", type: "text" },
              { name: "hiredAt", label: "入職日期", type: "date" },
              { name: "phone", label: "電話", type: "text" },
              { name: "username", label: "帳號", type: "text" },
            ] as const
          ).map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input
                id={f.name}
                type={f.type}
                {...register(f.name as "name")}
              />
              {errors[f.name as keyof CreateEmployeeInput] && (
                <p className="text-xs text-destructive">
                  {(errors[f.name as keyof CreateEmployeeInput] as { message?: string })?.message}
                </p>
              )}
            </div>
          ))}
          {isNew && (
            <div className="space-y-1.5">
              <Label htmlFor="initialPassword">初始密碼（≥ 8 字元）</Label>
              <Input
                id="initialPassword"
                type="password"
                {...register("initialPassword")}
              />
              {errors.initialPassword && (
                <p className="text-xs text-destructive">{errors.initialPassword.message}</p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>角色</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("role")}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>狀態</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("status")}
            >
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "ACTIVE" ? "在職" : "離職"}
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

function ResetPasswordDialog({
  employee,
  onClose,
}: {
  employee: EmployeeRow;
  onClose: () => void;
}) {
  const reset = useMutation({
    mutationFn: (body: ResetPasswordInput) =>
      apiClient.post(`/employees/${employee.id}/reset-password`, body),
    onSuccess: onClose,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重設 {employee.name} 的密碼</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              await reset.mutateAsync(values);
            } catch (err) {
              if (err instanceof ApiError) setError("root", { message: err.message });
            }
          })}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">新密碼（≥ 8 字元）</Label>
            <Input id="newPassword" type="password" {...register("newPassword")} />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              送出
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
