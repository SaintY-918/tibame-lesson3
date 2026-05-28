import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { LoginPage } from "./Login";
import { apiClient, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiClient: { post: vi.fn() },
  };
});

beforeEach(() => {
  useAuthStore.setState({ user: null, csrfToken: null, hydrated: true });
  vi.mocked(apiClient.post as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe("LoginPage", () => {
  it("happy path: writes session and navigates", async () => {
    vi.mocked(apiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: { id: "1", name: "Alice", role: "USER", employeeId: "1", email: "a@x" },
        csrfToken: "csrf-1",
      },
    });
    render(renderWithProviders(<LoginPage />));
    await userEvent.type(screen.getByLabelText("帳號"), "alice");
    await userEvent.type(screen.getByLabelText("密碼"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /登入/ }));
    await waitFor(() => {
      expect(useAuthStore.getState().user?.name).toBe("Alice");
      expect(useAuthStore.getState().csrfToken).toBe("csrf-1");
    });
  });

  it("renders ACCOUNT_LOCKED with unlockAt", async () => {
    const unlockAt = new Date(Date.now() + 60_000).toISOString();
    vi.mocked(apiClient.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError(401, "ACCOUNT_LOCKED", "locked", { unlockAt }),
    );
    render(renderWithProviders(<LoginPage />));
    await userEvent.type(screen.getByLabelText("帳號"), "alice");
    await userEvent.type(screen.getByLabelText("密碼"), "wrongwrong");
    await userEvent.click(screen.getByRole("button", { name: /登入/ }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/鎖定/);
  });

  it("renders INVALID_CREDENTIALS message", async () => {
    vi.mocked(apiClient.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError(401, "INVALID_CREDENTIALS", "bad"),
    );
    render(renderWithProviders(<LoginPage />));
    await userEvent.type(screen.getByLabelText("帳號"), "alice");
    await userEvent.type(screen.getByLabelText("密碼"), "wrongwrong");
    await userEvent.click(screen.getByRole("button", { name: /登入/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/帳號或密碼錯誤/);
  });
});
