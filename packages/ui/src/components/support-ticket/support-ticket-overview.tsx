// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SupportTicket, SupportTicketStatus, SupportTicketActivity, SupportTicketMetric, SupportTicketSettingsValues } from './types.js';
export interface SupportTicketOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SupportTicket[];
    metrics: readonly SupportTicketMetric[];
}
export function SupportTicketOverview(props: SupportTicketOverviewProps) { return <DomainOverview config={config} {...props}/>; }
