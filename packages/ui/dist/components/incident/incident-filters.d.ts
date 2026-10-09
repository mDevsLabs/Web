import { type DomainFrameProps } from '../../internal/domain.js';
import type { IncidentStatus } from './types.js';
export interface IncidentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: IncidentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: IncidentStatus | '') => void;
}
export declare function IncidentFilters({ onStatusChange, ...props }: IncidentFiltersProps): import("react").JSX.Element;
