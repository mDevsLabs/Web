import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucket, StorageBucketMetric } from './types.js';
export interface StorageBucketOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly StorageBucket[];
    metrics: readonly StorageBucketMetric[];
}
export declare function StorageBucketOverview(props: StorageBucketOverviewProps): import("react").JSX.Element;
