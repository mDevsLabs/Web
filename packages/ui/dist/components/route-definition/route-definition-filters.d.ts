import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinitionStatus } from './types.js';
export interface RouteDefinitionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RouteDefinitionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RouteDefinitionStatus | '') => void;
}
export declare function RouteDefinitionFilters({ onStatusChange, ...props }: RouteDefinitionFiltersProps): import("react").JSX.Element;
