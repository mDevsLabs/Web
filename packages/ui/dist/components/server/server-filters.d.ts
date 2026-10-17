import { type DomainFrameProps } from '../../internal/domain.js';
import type { ServerStatus } from './types.js';
export interface ServerFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ServerStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ServerStatus | '') => void;
}
export declare function ServerFilters({ onStatusChange, ...props }: ServerFiltersProps): import("react").JSX.Element;
