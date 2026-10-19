import { type DomainFrameProps } from '../../internal/domain.js';
import type { MilestoneStatus } from './types.js';
export interface MilestoneFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MilestoneStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MilestoneStatus | '') => void;
}
export declare function MilestoneFilters({ onStatusChange, ...props }: MilestoneFiltersProps): import("react").JSX.Element;
