import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpointStatus } from './types.js';
export interface ApiEndpointFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ApiEndpointStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ApiEndpointStatus | '') => void;
}
export declare function ApiEndpointFilters({ onStatusChange, ...props }: ApiEndpointFiltersProps): import("react").JSX.Element;
