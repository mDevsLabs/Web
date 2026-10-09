// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SupportTicket, SupportTicketStatus, SupportTicketActivity, SupportTicketMetric, SupportTicketSettingsValues } from './types.js';
export interface SupportTicketTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SupportTicket[];
    emptyMessage?: string;
}
export function SupportTicketTable(props: SupportTicketTableProps) { return <DomainTable config={config} {...props}/>; }
