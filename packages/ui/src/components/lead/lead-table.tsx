// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lead, LeadStatus, LeadActivity, LeadMetric, LeadSettingsValues } from './types.js';
export interface LeadTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lead[];
    emptyMessage?: string;
}
export function LeadTable(props: LeadTableProps) { return <DomainTable config={config} {...props}/>; }
