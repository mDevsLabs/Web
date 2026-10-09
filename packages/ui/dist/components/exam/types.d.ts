import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Exam = {
    id?: string;
    title: string;
    course: string;
    scheduledOn: string;
    durationMinutes: number;
    status: "scheduled" | "open" | "graded";
};
export type ExamStatus = Exam['status'];
export interface ExamActivity extends DomainActivity {
    examId?: string;
}
export type ExamMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalExam' | 'activeExam' | 'valueExam';
};
export type ExamSettingsValues = Partial<Record<"notifyExam" | "archiveExam" | "approveExam", boolean>>;
