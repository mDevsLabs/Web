import { type DomainFrameProps } from '../../internal/domain.js';
import type { IntegrationStatus } from './types.js';
export interface IntegrationFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: IntegrationStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: IntegrationStatus | '') => void;
}
export declare function IntegrationFilters({ onStatusChange, ...props }: IntegrationFiltersProps): import("react").JSX.Element;
