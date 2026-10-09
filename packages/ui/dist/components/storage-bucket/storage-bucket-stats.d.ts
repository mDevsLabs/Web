import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucketMetric } from './types.js';
export interface StorageBucketStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly StorageBucketMetric[];
}
export declare function StorageBucketStats(props: StorageBucketStatsProps): import("react").JSX.Element;
