import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Folder = {
    id?: string;
    name: string;
    owner: string;
    fileCount: number;
    updatedOn: string;
    status: "private" | "shared" | "archived";
};
export type FolderStatus = Folder['status'];
export interface FolderActivity extends DomainActivity {
    folderId?: string;
}
export type FolderMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalFolder' | 'activeFolder' | 'valueFolder';
};
export type FolderSettingsValues = Partial<Record<"notifyFolder" | "archiveFolder" | "approveFolder", boolean>>;
