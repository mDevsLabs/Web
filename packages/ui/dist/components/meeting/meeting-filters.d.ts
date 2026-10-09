import { type DomainFrameProps } from '../../internal/domain.js';
import type { MeetingStatus } from './types.js';
export interface MeetingFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MeetingStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MeetingStatus | '') => void;
}
export declare function MeetingFilters({ onStatusChange, ...props }: MeetingFiltersProps): import("react").JSX.Element;
