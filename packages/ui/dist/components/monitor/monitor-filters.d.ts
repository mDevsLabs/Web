import { type DomainFrameProps } from '../../internal/domain.js';
import type { MonitorStatus } from './types.js';
export interface MonitorFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MonitorStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MonitorStatus | '') => void;
}
export declare function MonitorFilters({ onStatusChange, ...props }: MonitorFiltersProps): import("react").JSX.Element;
