// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lead, LeadStatus, LeadActivity, LeadMetric, LeadSettingsValues } from './types.js';
export interface LeadCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Lead;
}
export function LeadCard(props: LeadCardProps) { return <DomainCard config={config} {...props}/>; }
