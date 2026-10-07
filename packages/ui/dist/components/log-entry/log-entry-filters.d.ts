import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntryStatus } from './types.js';
export interface LogEntryFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: LogEntryStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: LogEntryStatus | '') => void;
}
export declare function LogEntryFilters({ onStatusChange, ...props }: LogEntryFiltersProps): import("react").JSX.Element;
