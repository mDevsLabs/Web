import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReleaseStatus } from './types.js';
export interface ReleaseFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ReleaseStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ReleaseStatus | '') => void;
}
export declare function ReleaseFilters({ onStatusChange, ...props }: ReleaseFiltersProps): import("react").JSX.Element;
