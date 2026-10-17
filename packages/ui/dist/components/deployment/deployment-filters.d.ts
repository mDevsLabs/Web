import { type DomainFrameProps } from '../../internal/domain.js';
import type { DeploymentStatus } from './types.js';
export interface DeploymentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: DeploymentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: DeploymentStatus | '') => void;
}
export declare function DeploymentFilters({ onStatusChange, ...props }: DeploymentFiltersProps): import("react").JSX.Element;
