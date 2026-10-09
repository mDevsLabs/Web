// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SupportTicket, SupportTicketStatus, SupportTicketActivity, SupportTicketMetric, SupportTicketSettingsValues } from './types.js';
export interface SupportTicketFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<SupportTicket>;
    onSubmit: (value: Omit<SupportTicket, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function SupportTicketForm({ onSubmit, ...props }: SupportTicketFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<SupportTicket, 'id'>)}/>; }
