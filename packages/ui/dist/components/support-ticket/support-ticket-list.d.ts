import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicket } from './types.js';
export interface SupportTicketListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SupportTicket[];
    onSelect?: (item: SupportTicket) => void;
    emptyMessage?: string;
}
export declare function SupportTicketList({ onSelect, ...props }: SupportTicketListProps): import("react").JSX.Element;
