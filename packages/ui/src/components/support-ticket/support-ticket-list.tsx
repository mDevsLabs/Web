// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SupportTicket, SupportTicketStatus, SupportTicketActivity, SupportTicketMetric, SupportTicketSettingsValues } from './types.js';
export interface SupportTicketListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SupportTicket[];
    onSelect?: (item: SupportTicket) => void;
    emptyMessage?: string;
}
export function SupportTicketList({ onSelect, ...props }: SupportTicketListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as SupportTicket) : undefined}/>; }
