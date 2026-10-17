import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Collection = {
    id?: string;
    name: string;
    curator: string;
    itemCount: number;
    updatedOn: string;
    status: "draft" | "public" | "private";
};
export type CollectionStatus = Collection['status'];
export interface CollectionActivity extends DomainActivity {
    collectionId?: string;
}
export type CollectionMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalCollection' | 'activeCollection' | 'valueCollection';
};
export type CollectionSettingsValues = Partial<Record<"notifyCollection" | "archiveCollection" | "approveCollection", boolean>>;
