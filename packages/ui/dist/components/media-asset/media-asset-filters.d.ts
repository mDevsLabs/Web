import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAssetStatus } from './types.js';
export interface MediaAssetFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MediaAssetStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MediaAssetStatus | '') => void;
}
export declare function MediaAssetFilters({ onStatusChange, ...props }: MediaAssetFiltersProps): import("react").JSX.Element;
