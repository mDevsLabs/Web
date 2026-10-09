import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Workout = {
    id?: string;
    title: string;
    activity: string;
    durationMinutes: number;
    calories: number;
    status: "planned" | "completed" | "skipped";
};
export type WorkoutStatus = Workout['status'];
export interface WorkoutActivity extends DomainActivity {
    workoutId?: string;
}
export type WorkoutMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalWorkout' | 'activeWorkout' | 'valueWorkout';
};
export type WorkoutSettingsValues = Partial<Record<"notifyWorkout" | "archiveWorkout" | "approveWorkout", boolean>>;
