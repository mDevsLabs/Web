import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Template = {
    id?: string;
    name: string;
    author: string;
    usageCount: number;
    category: string;
    status: "draft" | "published" | "archived";
};
export type TemplateStatus = Template['status'];
export interface TemplateActivity extends DomainActivity {
    templateId?: string;
}
export type TemplateMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTemplate' | 'activeTemplate' | 'valueTemplate';
};
export type TemplateSettingsValues = Partial<Record<"notifyTemplate" | "archiveTemplate" | "approveTemplate", boolean>>;
