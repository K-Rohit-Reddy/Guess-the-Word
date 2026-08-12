const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface FetchOptions extends RequestInit {
  skipRedirect?: boolean;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipRedirect, ...fetchOpts } = options;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOpts.headers,
    },
    ...fetchOpts,
  });

  if (res.status === 401 && !skipRedirect) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────
export interface User {
  id: number;
  display_name: string;
  username: string;
  role: string;
  created_at?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export const authAPI = {
  register: (data: {
    display_name: string;
    username: string;
    password: string;
  }) =>
    fetchAPI<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { username: string; password: string }) =>
    fetchAPI<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipRedirect: true,
    }),

  logout: () =>
    fetchAPI<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () =>
    fetchAPI<User>("/auth/me", { skipRedirect: true }),
};

// ── Game ──────────────────────────────────────────────────────────
export interface LetterResult {
  letter: string;
  position: number;
  status: "correct" | "present" | "absent";
}

export interface GuessResponse {
  attempt_number: number;
  letters: LetterResult[];
  is_correct: boolean;
}

export interface GameResponse {
  game_id: number;
  status: "in_progress" | "won" | "lost";
  guesses: GuessResponse[];
  max_attempts: number;
  word?: string | null;
}

export interface StartGameResponse {
  game_id: number;
  message: string;
}

export interface GameHistoryItem {
  game_id: number;
  status: string;
  date: string;
  attempts: number;
  guesses: GuessResponse[];
}

export interface PlayerStats {
  total_games: number;
  total_wins: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  games_today: number;
  games_remaining_today: number;
}

export const gameAPI = {
  start: () =>
    fetchAPI<StartGameResponse>("/game/start", { method: "POST" }),

  guess: (gameId: number, word: string) =>
    fetchAPI<GameResponse>(`/game/${gameId}/guess`, {
      method: "POST",
      body: JSON.stringify({ word }),
    }),

  getCurrent: () =>
    fetchAPI<GameResponse>("/game/current"),

  getGame: (gameId: number) =>
    fetchAPI<GameResponse>(`/game/${gameId}`),

  getHistory: () =>
    fetchAPI<GameHistoryItem[]>("/game/history/"),

  getStats: () =>
    fetchAPI<PlayerStats>("/game/stats/"),
};

// ── Settings ──────────────────────────────────────────────────────
export interface UsernameCheck {
  username: string;
  available: boolean;
}

export const settingsAPI = {
  checkUsername: (username: string) =>
    fetchAPI<UsernameCheck>(`/settings/check-username/${username}`, { skipRedirect: true }),

  updateProfile: (data: { display_name?: string; username?: string }) =>
    fetchAPI<User>("/settings/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  changePassword: (data: {
    current_password: string;
    new_password: string;
  }) =>
    fetchAPI<{ message: string }>("/settings/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ── Admin ─────────────────────────────────────────────────────────
export interface PlatformStats {
  total_players: number;
  total_games: number;
  total_wins: number;
  overall_win_rate: number;
  games_today: number;
  wins_today: number;
  active_players_today: number;
}

export interface DailyReport {
  date: string;
  total_users: number;
  total_games: number;
  total_correct_guesses: number;
  win_rate: number;
}

export interface UserReportEntry {
  date: string;
  words_tried: number;
  correct_guesses: number;
  win_rate: number;
}

export interface UserReport {
  user_id: number;
  display_name: string;
  username: string;
  total_games: number;
  total_wins: number;
  win_rate: number;
  entries: UserReportEntry[];
}

export interface UserListItem {
  id: number;
  display_name: string;
  username: string;
  role: string;
  total_games: number;
  total_wins: number;
  win_rate: number;
  created_at?: string;
}

export const adminAPI = {
  getStats: () =>
    fetchAPI<PlatformStats>("/admin/stats"),

  getDailyReport: (date: string) =>
    fetchAPI<DailyReport>(`/admin/report/daily?date=${date}`),

  getDailyRange: (fromDate: string, toDate: string) =>
    fetchAPI<DailyReport[]>(
      `/admin/report/daily-range?from_date=${fromDate}&to_date=${toDate}`
    ),

  getUserReport: (
    userId: number,
    fromDate?: string,
    toDate?: string
  ) => {
    let url = `/admin/report/user/${userId}`;
    if (fromDate && toDate) {
      url += `?from_date=${fromDate}&to_date=${toDate}`;
    }
    return fetchAPI<UserReport>(url);
  },

  getUsers: (params?: {
    search?: string;
    sort_by?: string;
    order?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.order) query.set("order", params.order);
    const qs = query.toString();
    return fetchAPI<UserListItem[]>(`/admin/users${qs ? `?${qs}` : ""}`);
  },

  updateUser: (
    userId: number,
    data: {
      display_name?: string;
      username?: string;
      role?: string;
      password?: string;
    }
  ) =>
    fetchAPI<User>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: number) =>
    fetchAPI<{ message: string }>(`/admin/users/${userId}`, {
      method: "DELETE",
    }),

  getWords: () =>
    fetchAPI<{ id: number; word: string }[]>("/admin/words"),

  addWord: (word: string) =>
    fetchAPI<{ id: number; word: string }>("/admin/words", {
      method: "POST",
      body: JSON.stringify({ word }),
    }),

  deleteWord: (wordId: number) =>
    fetchAPI<{ message: string }>(`/admin/words/${wordId}`, {
      method: "DELETE",
    }),
};
