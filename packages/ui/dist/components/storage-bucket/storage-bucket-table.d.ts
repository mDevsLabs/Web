import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucket } from './types.js';
export interface StorageBucketTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly StorageBucket[];
    emptyMessage?: string;
}
export declare function StorageBucketTable(props: StorageBucketTableProps): import("react").JSX.Element;
