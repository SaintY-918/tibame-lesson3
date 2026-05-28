import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Car, LayoutDashboard, LogOut, Moon, Sun, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("vms-theme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("vms-theme", theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(theme === "light" ? "dark" : "light") };
}

export function AppShell() {
  const { user, clearSession } = useAuthStore();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();

  const onLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearSession();
      nav("/login");
    }
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r p-4 flex flex-col gap-1">
        <Link to="/" className="font-bold text-xl mb-4">
          VMS
        </Link>
        <NavItem to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" end />
        <NavItem to="/vehicles" icon={<Car className="h-4 w-4" />} label="車輛" />
        {user?.role === "ADMIN" && (
          <NavItem to="/employees" icon={<Users className="h-4 w-4" />} label="員工" />
        )}
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-end px-4 gap-3">
          <span className="text-sm text-muted-foreground">
            {user?.name}（{user?.role === "ADMIN" ? "管理員" : "使用者"}）
          </span>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="切換主題">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            登出
          </Button>
        </header>
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
          isActive && "bg-accent font-medium",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
