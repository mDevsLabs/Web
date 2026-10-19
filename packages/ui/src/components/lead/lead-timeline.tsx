// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lead, LeadStatus, LeadActivity, LeadMetric, LeadSettingsValues } from './types.js';
export interface LeadTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly LeadActivity[];
    emptyMessage?: string;
}
export function LeadTimeline(props: LeadTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
