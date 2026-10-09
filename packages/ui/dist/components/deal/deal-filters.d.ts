import { type DomainFrameProps } from '../../internal/domain.js';
import type { DealStatus } from './types.js';
export interface DealFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: DealStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: DealStatus | '') => void;
}
export declare function DealFilters({ onStatusChange, ...props }: DealFiltersProps): import("react").JSX.Element;
