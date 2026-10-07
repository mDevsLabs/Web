// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly InvoiceActivity[];
    emptyMessage?: string;
}
export function InvoiceTimeline(props: InvoiceTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
