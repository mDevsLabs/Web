import { type DomainFrameProps } from '../../internal/domain.js';
import type { GoalStatus } from './types.js';
export interface GoalFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: GoalStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: GoalStatus | '') => void;
}
export declare function GoalFilters({ onStatusChange, ...props }: GoalFiltersProps): import("react").JSX.Element;
