import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucketStatus } from './types.js';
export interface StorageBucketFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: StorageBucketStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: StorageBucketStatus | '') => void;
}
export declare function StorageBucketFilters({ onStatusChange, ...props }: StorageBucketFiltersProps): import("react").JSX.Element;
