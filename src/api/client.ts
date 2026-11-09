import type {
  IconOption,
  DateControlEntry,
  DateControlEntryAttachment,
  DateControlEntryScope,
  DateControlEntryStatus,
  DateControlParty,
  DateControlRecurrenceType,
  DateControlSource,
  DateTimeControlEntry,
  DateTimeControlEntryStatus,
  Module,
  ModulePattern,
  Notification,
  PartyRelationship,
  ReminderRules,
  Routine,
  RoutineStatus,
  TimeControlItem,
  TimeControlItemStatus,
  TimeControlOccurrence,
  TimeControlOccurrenceStatus,
  TimeControlParty,
} from "../types";

// Empty = same origin: in dev Vite proxies /api and /hubs to the backend (see vite.config.ts), and
// in production the frontend container's nginx does the same — so the PWA works from any host
// (e.g. the phone hitting the machine's LAN/HTTPS address) without hardcoding localhost.
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "";
const API_BASE_URL = `${API_ORIGIN}/api`;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Bearer token of the signed-in user (see auth/AuthProvider). Kept here so every API call — and
// the SignalR connection — picks it up without threading it through props.
const TOKEN_KEY = "agent-office.token";
let unauthorizedHandler: (() => void) | null = null;

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked (private mode): the session just won't survive a reload.
  }
}

/** Called on any 401 — the token expired or was revoked, so the app signs out. */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    // FormData (file uploads) needs the browser to set its own multipart boundary.
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 401 && token) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    // Validation errors come back as ProblemDetails with a user-facing Portuguese title.
    let message = `${init?.method ?? "GET"} ${path} failed`;
    try {
      const problem = (await response.json()) as { title?: string };
      if (problem.title) message = problem.title;
    } catch {
      // Not JSON — keep the generic message.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  login: string;
}

export interface AuthResult {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  login: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    request<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (login: string, password: string) =>
    request<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify({ login, password }) }),
  me: () => request<AuthUser>("/auth/me"),
};

export interface CreateModuleInput {
  name: string;
  icon: string;
  pattern: ModulePattern;
}

export const modulesApi = {
  list: () => request<Module[]>("/modules"),
  create: (input: CreateModuleInput) =>
    request<Module>("/modules", { method: "POST", body: JSON.stringify(input) }),
};

export interface CreateDateControlPartyInput {
  name: string;
  relationship: PartyRelationship;
}

export const dateControlPartiesApi = {
  list: (moduleId: string) => request<DateControlParty[]>(`/modules/${moduleId}/parties`),
  create: (moduleId: string, input: CreateDateControlPartyInput) =>
    request<DateControlParty>(`/modules/${moduleId}/parties`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (moduleId: string, id: string, input: CreateDateControlPartyInput) =>
    request<DateControlParty>(`/modules/${moduleId}/parties/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  remove: (moduleId: string, id: string) =>
    request<void>(`/modules/${moduleId}/parties/${id}`, { method: "DELETE" }),
};

export interface SaveIconOptionInput {
  name: string;
  icon: string;
}

/** CRUD for a module's icon-labelled list (`categories` for DateControl, `time-types` for TimeControl). */
function iconOptionsApi(segment: string) {
  return {
    list: (moduleId: string) => request<IconOption[]>(`/modules/${moduleId}/${segment}`),
    create: (moduleId: string, input: SaveIconOptionInput) =>
      request<IconOption>(`/modules/${moduleId}/${segment}`, { method: "POST", body: JSON.stringify(input) }),
    update: (moduleId: string, id: string, input: SaveIconOptionInput) =>
      request<IconOption>(`/modules/${moduleId}/${segment}/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (moduleId: string, id: string) =>
      request<void>(`/modules/${moduleId}/${segment}/${id}`, { method: "DELETE" }),
  };
}

export const dateControlCategoriesApi = iconOptionsApi("categories");
export const timeControlTypesApi = iconOptionsApi("time-types");

export interface CreateDateControlSourceInput {
  description: string;
  dateControlCategoryId: string;
}

export const dateControlSourcesApi = {
  list: (moduleId: string) => request<DateControlSource[]>(`/modules/${moduleId}/sources`),
  create: (moduleId: string, input: CreateDateControlSourceInput) =>
    request<DateControlSource>(`/modules/${moduleId}/sources`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (moduleId: string, id: string) =>
    request<void>(`/modules/${moduleId}/sources/${id}`, { method: "DELETE" }),
};

export interface CreateDateControlEntryInput {
  dateControlSourceId: string;
  dateControlPartyId: string;
  amount: number;
  dueDate: string;
  installmentsCount: number | null;
  recurrenceType: DateControlRecurrenceType;
  recurrenceCount: number | null;
  scope: DateControlEntryScope;
  notes: string | null;
}

export interface UpdateDateControlEntryInput {
  dateControlPartyId: string;
  amount: number;
  dueDate: string;
  scope: DateControlEntryScope;
  notes: string | null;
}

export const dateControlEntriesApi = {
  list: (moduleId: string) => request<DateControlEntry[]>(`/modules/${moduleId}/entries`),
  create: (moduleId: string, input: CreateDateControlEntryInput) =>
    request<DateControlEntry>(`/modules/${moduleId}/entries`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (moduleId: string, id: string, input: UpdateDateControlEntryInput) =>
    request<DateControlEntry>(`/modules/${moduleId}/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  updateStatus: (moduleId: string, id: string, status: DateControlEntryStatus) =>
    request<DateControlEntry>(`/modules/${moduleId}/entries/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (moduleId: string, id: string) =>
    request<void>(`/modules/${moduleId}/entries/${id}`, { method: "DELETE" }),
  listAttachments: (moduleId: string, id: string) =>
    request<DateControlEntryAttachment[]>(`/modules/${moduleId}/entries/${id}/attachments`),
  uploadAttachment: (moduleId: string, id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<DateControlEntryAttachment>(`/modules/${moduleId}/entries/${id}/attachments`, {
      method: "POST",
      body,
    });
  },
  removeAttachment: (moduleId: string, id: string, attachmentId: string) =>
    request<void>(`/modules/${moduleId}/entries/${id}/attachments/${attachmentId}`, { method: "DELETE" }),
  /** Opened directly by the browser (link), not fetched — served inline by the API. */
  attachmentUrl: (moduleId: string, id: string, attachmentId: string) =>
    `${API_BASE_URL}/modules/${moduleId}/entries/${id}/attachments/${attachmentId}`,
};

export interface ScheduleInput {
  daysOfWeek: string[] | null;
  hours: number[];
  minute: number;
  rawCron: string | null;
}

export interface CreateRoutineInput {
  title: string;
  moduleId: string;
  schedule: ScheduleInput;
  reminderRules: ReminderRules | null;
}

export interface UpdateRoutineInput {
  title: string;
  schedule: ScheduleInput;
  reminderRules: ReminderRules | null;
}

export const routinesApi = {
  list: () => request<Routine[]>("/routines"),
  create: (input: CreateRoutineInput) =>
    request<Routine>("/routines", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: UpdateRoutineInput) =>
    request<Routine>(`/routines/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  updateStatus: (id: string, status: RoutineStatus) =>
    request<Routine>(`/routines/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  triggerNow: (id: string) => request<Routine>(`/routines/${id}/trigger-now`, { method: "POST" }),
  remove: (id: string) => request<void>(`/routines/${id}`, { method: "DELETE" }),
};

export const notificationsApi = {
  list: () => request<Notification[]>("/notifications"),
  markAsRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: "PATCH" }),
  bulkDelete: (ids: string[]) =>
    request<void>("/notifications/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
};

export interface CreateTimeControlPartyInput {
  name: string;
  relationship: PartyRelationship;
}

export const timeControlPartiesApi = {
  list: (moduleId: string) => request<TimeControlParty[]>(`/modules/${moduleId}/time-parties`),
  create: (moduleId: string, input: CreateTimeControlPartyInput) =>
    request<TimeControlParty>(`/modules/${moduleId}/time-parties`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (moduleId: string, id: string, input: CreateTimeControlPartyInput) =>
    request<TimeControlParty>(`/modules/${moduleId}/time-parties/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  remove: (moduleId: string, id: string) =>
    request<void>(`/modules/${moduleId}/time-parties/${id}`, { method: "DELETE" }),
};

export interface CreateTimeControlItemInput {
  title: string;
  timeControlTypeId: string;
  timeControlPartyId: string;
  dosage: string | null;
  schedule: ScheduleInput;
}

export interface UpdateTimeControlItemInput {
  title: string;
  timeControlTypeId: string;
  timeControlPartyId: string;
  dosage: string | null;
  schedule: ScheduleInput;
}

export const timeControlItemsApi = {
  list: (moduleId: string) => request<TimeControlItem[]>(`/modules/${moduleId}/items`),
  create: (moduleId: string, input: CreateTimeControlItemInput) =>
    request<TimeControlItem>(`/modules/${moduleId}/items`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (moduleId: string, id: string, input: UpdateTimeControlItemInput) =>
    request<TimeControlItem>(`/modules/${moduleId}/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  updateStatus: (moduleId: string, id: string, status: TimeControlItemStatus) =>
    request<TimeControlItem>(`/modules/${moduleId}/items/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (moduleId: string, id: string) =>
    request<void>(`/modules/${moduleId}/items/${id}`, { method: "DELETE" }),
};

export const timeControlOccurrencesApi = {
  list: (moduleId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return request<TimeControlOccurrence[]>(`/modules/${moduleId}/occurrences${qs ? `?${qs}` : ""}`);
  },
  updateStatus: (moduleId: string, id: string, status: TimeControlOccurrenceStatus) =>
    request<TimeControlOccurrence>(`/modules/${moduleId}/occurrences/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export interface CreateDateTimeControlEntryInput {
  title: string;
  scheduledAt: string;
  durationMinutes: number | null;
  notes: string | null;
}

export interface UpdateDateTimeControlEntryInput {
  title: string;
  scheduledAt: string;
  durationMinutes: number | null;
  notes: string | null;
}

export const dateTimeControlEntriesApi = {
  list: (moduleId: string) => request<DateTimeControlEntry[]>(`/modules/${moduleId}/schedule-entries`),
  create: (moduleId: string, input: CreateDateTimeControlEntryInput) =>
    request<DateTimeControlEntry>(`/modules/${moduleId}/schedule-entries`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (moduleId: string, id: string, input: UpdateDateTimeControlEntryInput) =>
    request<DateTimeControlEntry>(`/modules/${moduleId}/schedule-entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  updateStatus: (moduleId: string, id: string, status: DateTimeControlEntryStatus) =>
    request<DateTimeControlEntry>(`/modules/${moduleId}/schedule-entries/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (moduleId: string, id: string) =>
    request<void>(`/modules/${moduleId}/schedule-entries/${id}`, { method: "DELETE" }),
};
