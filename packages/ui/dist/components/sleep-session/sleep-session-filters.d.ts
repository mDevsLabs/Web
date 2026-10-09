import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSessionStatus } from './types.js';
export interface SleepSessionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SleepSessionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SleepSessionStatus | '') => void;
}
export declare function SleepSessionFilters({ onStatusChange, ...props }: SleepSessionFiltersProps): import("react").JSX.Element;
