import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicket } from './types.js';
export interface SupportTicketTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SupportTicket[];
    emptyMessage?: string;
}
export declare function SupportTicketTable(props: SupportTicketTableProps): import("react").JSX.Element;
