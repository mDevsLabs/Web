import { type DomainFrameProps } from '../../internal/domain.js';
import type { PipelineStatus } from './types.js';
export interface PipelineFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PipelineStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PipelineStatus | '') => void;
}
export declare function PipelineFilters({ onStatusChange, ...props }: PipelineFiltersProps): import("react").JSX.Element;
