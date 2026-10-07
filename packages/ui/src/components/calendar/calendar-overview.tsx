// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Calendar, CalendarStatus, CalendarActivity, CalendarMetric, CalendarSettingsValues } from './types.js';
export interface CalendarOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Calendar[];
    metrics: readonly CalendarMetric[];
}
export function CalendarOverview(props: CalendarOverviewProps) { return <DomainOverview config={config} {...props}/>; }
