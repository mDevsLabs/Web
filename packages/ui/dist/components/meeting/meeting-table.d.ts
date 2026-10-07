import { type DomainFrameProps } from '../../internal/domain.js';
import type { Meeting } from './types.js';
export interface MeetingTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Meeting[];
    emptyMessage?: string;
}
export declare function MeetingTable(props: MeetingTableProps): import("react").JSX.Element;
