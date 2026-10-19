import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Habit = {
    id?: string;
    name: string;
    frequency: string;
    streakDays: number;
    targetDays: number;
    status: "active" | "paused" | "completed";
};
export type HabitStatus = Habit['status'];
export interface HabitActivity extends DomainActivity {
    habitId?: string;
}
export type HabitMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalHabit' | 'activeHabit' | 'valueHabit';
};
export type HabitSettingsValues = Partial<Record<"notifyHabit" | "archiveHabit" | "approveHabit", boolean>>;
