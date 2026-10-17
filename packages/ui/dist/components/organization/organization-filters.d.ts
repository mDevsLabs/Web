import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrganizationStatus } from './types.js';
export interface OrganizationFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: OrganizationStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: OrganizationStatus | '') => void;
}
export declare function OrganizationFilters({ onStatusChange, ...props }: OrganizationFiltersProps): import("react").JSX.Element;
