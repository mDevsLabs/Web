// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TaxReport, TaxReportStatus, TaxReportActivity, TaxReportMetric, TaxReportSettingsValues } from './types.js';
export interface TaxReportTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TaxReportActivity[];
    emptyMessage?: string;
}
export function TaxReportTimeline(props: TaxReportTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
