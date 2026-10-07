import { type DomainFrameProps } from '../../internal/domain.js';
import type { RoadmapStatus } from './types.js';
export interface RoadmapFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RoadmapStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RoadmapStatus | '') => void;
}
export declare function RoadmapFilters({ onStatusChange, ...props }: RoadmapFiltersProps): import("react").JSX.Element;
