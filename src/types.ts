export type PartyRelationship =
  | "Self"
  | "Father"
  | "Mother"
  | "Spouse"
  | "Child"
  | "Other";

export type ModulePattern = "DateControl" | "TimeControl" | "DateTimeControl";

export interface Module {
  id: string;
  name: string;
  slug: string;
  icon: string;
  pattern: ModulePattern;
  createdAt: string;
}

export interface DateControlParty {
  id: string;
  moduleId: string;
  name: string;
  relationship: PartyRelationship;
  /** Records pointing at it — deleting is blocked while > 0. */
  usageCount: number;
}

/** Editable list entry with an icon — DateControl categories and TimeControl types share this shape. */
export interface IconOption {
  id: string;
  moduleId: string;
  name: string;
  icon: string;
  usageCount: number;
}

export interface DateControlSource {
  id: string;
  moduleId: string;
  description: string;
  dateControlCategoryId: string;
  categoryName: string;
  categoryIcon: string;
  entriesCount: number;
}

export type DateControlRecurrenceType = "None" | "ForecastDays" | "ForecastMonths" | "Indeterminate";

export type DateControlEntryStatus = "Pending" | "Paid" | "Overdue";

export type DateControlEntryScope = "Personal" | "Work";

export interface Notification {
  id: string;
  message: string;
  deliveredAt: string | null;
  readAt: string | null;
  category: RoutineType;
  moduleId: string;
}

export type RoutineType = "DateControlReminder" | "TimeControlReminder" | "DateTimeControlReminder";
export type RoutineStatus = "Active" | "Paused";

// Escalation rules for a DateControlReminder routine — null for every other RoutineType.
export interface ReminderRules {
  beforeDueDays: number | null;
  beforeDueTime: string | null;
  onDueDate: boolean;
  afterDueRepeatMinutes: number | null;
}

export interface Routine {
  id: string;
  title: string;
  moduleId: string;
  moduleName: string;
  type: RoutineType;
  daysOfWeek: string[] | null;
  hours: number[];
  minute: number;
  cronExpression: string;
  isAdvanced: boolean;
  nextRunAt: string | null;
  lastExecutedAt: string | null;
  triggerRequestedAt: string | null;
  reminderRules: ReminderRules | null;
  status: RoutineStatus;
}

export interface DateControlEntry {
  id: string;
  moduleId: string;
  dateControlSourceId: string;
  dateControlSourceDescription: string;
  categoryName: string;
  categoryIcon: string;
  dateControlPartyId: string;
  dateControlPartyName: string;
  amount: number;
  dueDate: string;
  installmentsCount: number | null;
  recurrenceType: DateControlRecurrenceType;
  recurrenceCount: number | null;
  status: DateControlEntryStatus;
  occurrenceNumber: number | null;
  scope: DateControlEntryScope;
  notes: string | null;
  attachmentsCount: number;
}

export interface DateControlEntryAttachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface TimeControlParty {
  id: string;
  moduleId: string;
  name: string;
  relationship: PartyRelationship;
  usageCount: number;
}

export type TimeControlItemStatus = "Active" | "Paused";

export interface TimeControlItem {
  id: string;
  moduleId: string;
  title: string;
  timeControlTypeId: string;
  typeName: string;
  typeIcon: string;
  timeControlPartyId: string;
  timeControlPartyName: string;
  dosage: string | null;
  status: TimeControlItemStatus;
  daysOfWeek: string[] | null;
  hours: number[];
  minute: number;
  cronExpression: string;
  isAdvanced: boolean;
}

export type TimeControlOccurrenceStatus = "Pending" | "Done" | "Missed";

export interface TimeControlOccurrence {
  id: string;
  timeControlItemId: string;
  timeControlItemTitle: string;
  typeName: string;
  typeIcon: string;
  timeControlPartyName: string;
  scheduledAt: string;
  status: TimeControlOccurrenceStatus;
  doneAt: string | null;
}

export type DateTimeControlEntryStatus = "Scheduled" | "Done" | "Cancelled" | "Missed";

export interface DateTimeControlEntry {
  id: string;
  moduleId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number | null;
  notes: string | null;
  status: DateTimeControlEntryStatus;
}
