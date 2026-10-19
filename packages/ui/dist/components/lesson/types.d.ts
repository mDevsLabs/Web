import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Lesson = {
    id?: string;
    title: string;
    course: string;
    durationMinutes: number;
    position: number;
    status: "draft" | "published";
};
export type LessonStatus = Lesson['status'];
export interface LessonActivity extends DomainActivity {
    lessonId?: string;
}
export type LessonMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalLesson' | 'activeLesson' | 'valueLesson';
};
export type LessonSettingsValues = Partial<Record<"notifyLesson" | "archiveLesson" | "approveLesson", boolean>>;
