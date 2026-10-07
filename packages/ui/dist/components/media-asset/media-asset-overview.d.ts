import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAsset, MediaAssetMetric } from './types.js';
export interface MediaAssetOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MediaAsset[];
    metrics: readonly MediaAssetMetric[];
}
export declare function MediaAssetOverview(props: MediaAssetOverviewProps): import("react").JSX.Element;
