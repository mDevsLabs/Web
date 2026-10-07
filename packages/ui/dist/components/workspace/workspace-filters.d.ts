import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkspaceStatus } from './types.js';
export interface WorkspaceFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: WorkspaceStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: WorkspaceStatus | '') => void;
}
export declare function WorkspaceFilters({ onStatusChange, ...props }: WorkspaceFiltersProps): import("react").JSX.Element;
