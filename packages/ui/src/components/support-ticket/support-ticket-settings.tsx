// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SupportTicket, SupportTicketStatus, SupportTicketActivity, SupportTicketMetric, SupportTicketSettingsValues } from './types.js';
export interface SupportTicketSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SupportTicketSettingsValues;
    onChange: (key: keyof SupportTicketSettingsValues, value: boolean) => void;
}
export function SupportTicketSettings({ onChange, ...props }: SupportTicketSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof SupportTicketSettingsValues, value)}/>; }
