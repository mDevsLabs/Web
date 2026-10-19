import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type StorageBucket = {
    id?: string;
    name: string;
    region: string;
    objectCount: number;
    sizeGb: number;
    status: "private" | "public" | "archived";
};
export type StorageBucketStatus = StorageBucket['status'];
export interface StorageBucketActivity extends DomainActivity {
    storagebucketId?: string;
}
export type StorageBucketMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalStorageBucket' | 'activeStorageBucket' | 'valueStorageBucket';
};
export type StorageBucketSettingsValues = Partial<Record<"notifyStorageBucket" | "archiveStorageBucket" | "approveStorageBucket", boolean>>;
