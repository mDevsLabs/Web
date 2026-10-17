import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAssetMetric } from './types.js';
export interface MediaAssetStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly MediaAssetMetric[];
}
export declare function MediaAssetStats(props: MediaAssetStatsProps): import("react").JSX.Element;
