import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnvironmentStatus } from './types.js';
export interface EnvironmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: EnvironmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: EnvironmentStatus | '') => void;
}
export declare function EnvironmentFilters({ onStatusChange, ...props }: EnvironmentFiltersProps): import("react").JSX.Element;
