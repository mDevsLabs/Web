// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SupportTicket, SupportTicketStatus, SupportTicketActivity, SupportTicketMetric, SupportTicketSettingsValues } from './types.js';
export interface SupportTicketFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SupportTicketStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SupportTicketStatus | '') => void;
}
export function SupportTicketFilters({ onStatusChange, ...props }: SupportTicketFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as SupportTicketStatus | '') : undefined}/>; }
