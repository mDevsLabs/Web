import { type DomainFrameProps } from '../../internal/domain.js';
import type { DestinationStatus } from './types.js';
export interface DestinationFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: DestinationStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: DestinationStatus | '') => void;
}
export declare function DestinationFilters({ onStatusChange, ...props }: DestinationFiltersProps): import("react").JSX.Element;
