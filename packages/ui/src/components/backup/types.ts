import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Backup = {
    id?: string;
    name: string;
    resource: string;
    sizeGb: number;
    createdOn: string;
    status: "scheduled" | "running" | "complete" | "failed";
};
export type BackupStatus = Backup['status'];
export interface BackupActivity extends DomainActivity {
    backupId?: string;
}
export type BackupMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBackup' | 'activeBackup' | 'valueBackup';
};
export type BackupSettingsValues = Partial<Record<"notifyBackup" | "archiveBackup" | "approveBackup", boolean>>;
