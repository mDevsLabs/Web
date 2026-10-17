import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Document = {
    id?: string;
    title: string;
    owner: string;
    pageCount: number;
    updatedOn: string;
    status: "draft" | "review" | "published";
};
export type DocumentStatus = Document['status'];
export interface DocumentActivity extends DomainActivity {
    documentId?: string;
}
export type DocumentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalDocument' | 'activeDocument' | 'valueDocument';
};
export type DocumentSettingsValues = Partial<Record<"notifyDocument" | "archiveDocument" | "approveDocument", boolean>>;
