// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SupportTicket, SupportTicketStatus, SupportTicketActivity, SupportTicketMetric, SupportTicketSettingsValues } from './types.js';
export interface SupportTicketEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function SupportTicketEmptyState(props: SupportTicketEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
