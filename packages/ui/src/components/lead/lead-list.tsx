// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lead, LeadStatus, LeadActivity, LeadMetric, LeadSettingsValues } from './types.js';
export interface LeadListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lead[];
    onSelect?: (item: Lead) => void;
    emptyMessage?: string;
}
export function LeadList({ onSelect, ...props }: LeadListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Lead) : undefined}/>; }
