import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicket, SupportTicketMetric } from './types.js';
export interface SupportTicketOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SupportTicket[];
    metrics: readonly SupportTicketMetric[];
}
export declare function SupportTicketOverview(props: SupportTicketOverviewProps): import("react").JSX.Element;
