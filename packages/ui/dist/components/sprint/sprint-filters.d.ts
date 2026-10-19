import { type DomainFrameProps } from '../../internal/domain.js';
import type { SprintStatus } from './types.js';
export interface SprintFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SprintStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SprintStatus | '') => void;
}
export declare function SprintFilters({ onStatusChange, ...props }: SprintFiltersProps): import("react").JSX.Element;
