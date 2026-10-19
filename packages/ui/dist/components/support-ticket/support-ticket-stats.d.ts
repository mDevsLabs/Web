import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicketMetric } from './types.js';
export interface SupportTicketStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly SupportTicketMetric[];
}
export declare function SupportTicketStats(props: SupportTicketStatsProps): import("react").JSX.Element;
