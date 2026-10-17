import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type MediaAsset = {
    id?: string;
    name: string;
    mediaType: string;
    sizeMb: number;
    uploadedOn: string;
    status: "processing" | "ready" | "failed";
};
export type MediaAssetStatus = MediaAsset['status'];
export interface MediaAssetActivity extends DomainActivity {
    mediaassetId?: string;
}
export type MediaAssetMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalMediaAsset' | 'activeMediaAsset' | 'valueMediaAsset';
};
export type MediaAssetSettingsValues = Partial<Record<"notifyMediaAsset" | "archiveMediaAsset" | "approveMediaAsset", boolean>>;
