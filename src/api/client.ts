import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ── Inject access token ───────────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
let refreshing = false;
let waitQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve) => {
          waitQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      refreshing = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        waitQueue.forEach((cb) => cb(data.accessToken));
        waitQueue = [];

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── Typed API methods ─────────────────────────────────────────────────────────

export const authApi = {
  register:      (body: RegisterBody) => api.post("/auth/register", body),
  login:         (identifier: string, password: string) =>
    api.post("/auth/login", { identifier, password }),
  logout:        (refreshToken: string) => api.post("/auth/logout", { refreshToken }),
  me:            () => api.get("/auth/me"),
  forgotPassword:(email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post("/auth/reset-password", { email, otp, newPassword }),
};

export const userApi = {
  updateProfile: (body: Partial<ProfileBody>) => api.patch("/users/profile", body),
  uploadAvatar:  (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return api.post("/users/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  getReviews: (userId: string) => api.get(`/users/${userId}/reviews`),
  getStats:   () => api.get("/users/stats"),
};

export const walletApi = {
  getBalance:     () => api.get("/wallet"),
  getTransactions:() => api.get("/wallet/transactions"),
  deposit:        (amount: number, method: string) => api.post("/wallet/deposit", { amount, method }),
  withdraw:       (amount: number, method: string) => api.post("/wallet/withdraw", { amount, method }),
};

export const tripApi = {
  estimate:     (body: EstimateBody) => api.post("/trips/estimate", body),
  create:       (body: CreateTripBody) => api.post("/trips", body),
  getAvailable: () => api.get("/trips/available"),
  getHistory:   () => api.get("/trips"),
  getOne:       (id: string) => api.get(`/trips/${id}`),
  accept:       (id: string) => api.post(`/trips/${id}/accept`),
  arrived:      (id: string) => api.post(`/trips/${id}/arrived`),
  start:        (id: string) => api.post(`/trips/${id}/start`),
  complete:     (id: string) => api.post(`/trips/${id}/complete`),
  cancel:       (id: string, reason?: string) => api.post(`/trips/${id}/cancel`, { reason }),
  rate:         (id: string, score: number, review?: string) =>
    api.post(`/trips/${id}/rate`, { score, review }),
};

export const driverApi = {
  toggleClock: () => api.post("/drivers/clock"),
  updateLocation: (lat: number, lng: number, tripId?: string) =>
    api.put("/drivers/location", { lat, lng, tripId }),
  uploadDocument: (docType: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/drivers/documents/${docType}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getDocuments: () => api.get("/drivers/documents"),
};

export const adminApi = {
  // Documents
  getPendingDocs: () => api.get("/admin/documents/pending"),
  reviewDoc:      (id: string, status: "VERIFIED" | "REJECTED", reviewNote?: string) =>
    api.patch(`/admin/documents/${id}`, { status, reviewNote }),

  // Users — CRUD + search
  getUsers:   (role?: string, page = 1, search = "") =>
    api.get("/admin/users", { params: { role, page, search } }),
  getUser:    (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, body: AdminUpdateUserBody) =>
    api.patch(`/admin/users/${id}`, body),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Trips — view + search + cancel
  getTrips:   (search = "", status = "") =>
    api.get("/admin/trips", { params: { search, status } }),
  cancelTrip: (id: string, reason: string) =>
    api.patch(`/admin/trips/${id}`, { status: "CANCELLED", cancelReason: reason }),

  // Stats
  getStats: () => api.get("/admin/stats"),

  // Reports
  getReportTripSummary:      (params?: { from?: string; to?: string; status?: string }) =>
    api.get("/reports/trip-summary", { params }),
  getReportDriverEarnings:   () => api.get("/reports/driver-earnings"),
  getReportPassengerActivity:() => api.get("/reports/passenger-activity"),
  getReportPlatformRevenue:  (days = 30) =>
    api.get("/reports/platform-revenue", { params: { days } }),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterBody {
  fullName: string; username: string; email: string; phone: string;
  password: string; dob: string; idNumber: string; role: "PASSENGER" | "DRIVER";
}
export interface ProfileBody {
  fullName: string; phone: string;
  vehicleMake: string; vehicleModel: string; vehiclePlate: string; vehicleColor: string;
}
export interface EstimateBody {
  pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number;
}
export interface CreateTripBody extends EstimateBody {
  pickupAddress: string; dropoffAddress: string; seats?: number;
}
export interface AdminUpdateUserBody {
  fullName?: string; phone?: string; role?: "PASSENGER" | "DRIVER" | "ADMIN"; newPassword?: string;
}
