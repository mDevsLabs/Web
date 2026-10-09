import { type DomainFrameProps } from '../../internal/domain.js';
import type { Meeting } from './types.js';
export interface MeetingListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Meeting[];
    onSelect?: (item: Meeting) => void;
    emptyMessage?: string;
}
export declare function MeetingList({ onSelect, ...props }: MeetingListProps): import("react").JSX.Element;
