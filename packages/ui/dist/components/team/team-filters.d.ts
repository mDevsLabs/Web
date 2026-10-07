import { type DomainFrameProps } from '../../internal/domain.js';
import type { TeamStatus } from './types.js';
export interface TeamFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TeamStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TeamStatus | '') => void;
}
export declare function TeamFilters({ onStatusChange, ...props }: TeamFiltersProps): import("react").JSX.Element;
