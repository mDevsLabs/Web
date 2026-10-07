import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJobStatus } from './types.js';
export interface BuildJobFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BuildJobStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BuildJobStatus | '') => void;
}
export declare function BuildJobFilters({ onStatusChange, ...props }: BuildJobFiltersProps): import("react").JSX.Element;
