import axios, { type AxiosError } from "axios";
import type { ApiErrorBody } from "@vms/shared";
import { useAuthStore } from "@/store/auth";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const csrf = useAuthStore.getState().csrfToken;
  if (csrf && config.method && ["post", "patch", "put", "delete"].includes(config.method)) {
    config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
});

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorBody["error"]["code"],
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

apiClient.interceptors.response.use(
  (r) => r,
  (err: AxiosError<ApiErrorBody>) => {
    if (err.response?.data?.error) {
      const { code, message, details } = err.response.data.error;
      throw new ApiError(err.response.status, code, message, details);
    }
    throw err;
  },
);
