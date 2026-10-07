import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucket } from './types.js';
export interface StorageBucketCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: StorageBucket;
}
export declare function StorageBucketCard(props: StorageBucketCardProps): import("react").JSX.Element;
