import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Course = {
    id?: string;
    title: string;
    instructor: string;
    durationHours: number;
    enrollmentCount: number;
    status: "draft" | "published" | "archived";
};
export type CourseStatus = Course['status'];
export interface CourseActivity extends DomainActivity {
    courseId?: string;
}
export type CourseMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCourse' | 'activeCourse' | 'valueCourse';
};
export type CourseSettingsValues = Partial<Record<"notifyCourse" | "archiveCourse" | "approveCourse", boolean>>;
