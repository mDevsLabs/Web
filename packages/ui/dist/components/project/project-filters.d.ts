import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProjectStatus } from './types.js';
export interface ProjectFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ProjectStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ProjectStatus | '') => void;
}
export declare function ProjectFilters({ onStatusChange, ...props }: ProjectFiltersProps): import("react").JSX.Element;
