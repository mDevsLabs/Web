import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicket } from './types.js';
export interface SupportTicketCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: SupportTicket;
}
export declare function SupportTicketCard(props: SupportTicketCardProps): import("react").JSX.Element;
