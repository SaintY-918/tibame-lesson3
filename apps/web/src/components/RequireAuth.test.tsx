import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequireAdmin, RequireAuth } from "./RequireAuth";
import { useAuthStore } from "@/store/auth";

function setUser(role: "ADMIN" | "USER" | null) {
  useAuthStore.setState({
    user: role
      ? { id: "1", name: "U", role, employeeId: "1", email: "u@x" }
      : null,
    csrfToken: null,
    hydrated: true,
  });
}

describe("route guards", () => {
  beforeEach(() => setUser(null));

  it("RequireAuth redirects to /login when not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route
            path="/secret"
            element={
              <RequireAuth>
                <div>secret</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>at login</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("at login")).toBeInTheDocument();
  });

  it("RequireAdmin redirects user to /", () => {
    setUser("USER");
    render(
      <MemoryRouter initialEntries={["/employees"]}>
        <Routes>
          <Route
            path="/employees"
            element={
              <RequireAdmin>
                <div>employees-page</div>
              </RequireAdmin>
            }
          />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("employees-page")).toBeNull();
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("RequireAdmin renders for admin", () => {
    setUser("ADMIN");
    render(
      <MemoryRouter initialEntries={["/employees"]}>
        <Routes>
          <Route
            path="/employees"
            element={
              <RequireAdmin>
                <div>employees-page</div>
              </RequireAdmin>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("employees-page")).toBeInTheDocument();
  });
});
