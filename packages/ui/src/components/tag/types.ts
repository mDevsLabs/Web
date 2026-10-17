import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Tag = {
    id?: string;
    name: string;
    slug: string;
    usageCount: number;
    group: string;
    status: "active" | "archived";
};
export type TagStatus = Tag['status'];
export interface TagActivity extends DomainActivity {
    tagId?: string;
}
export type TagMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTag' | 'activeTag' | 'valueTag';
};
export type TagSettingsValues = Partial<Record<"notifyTag" | "archiveTag" | "approveTag", boolean>>;
