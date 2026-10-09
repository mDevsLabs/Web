// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lead, LeadStatus, LeadActivity, LeadMetric, LeadSettingsValues } from './types.js';
export interface LeadEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function LeadEmptyState(props: LeadEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
