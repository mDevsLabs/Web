import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucket } from './types.js';
export interface StorageBucketListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly StorageBucket[];
    onSelect?: (item: StorageBucket) => void;
    emptyMessage?: string;
}
export declare function StorageBucketList({ onSelect, ...props }: StorageBucketListProps): import("react").JSX.Element;
