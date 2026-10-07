// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Calendar, CalendarStatus, CalendarActivity, CalendarMetric, CalendarSettingsValues } from './types.js';
export interface CalendarCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Calendar;
}
export function CalendarCard(props: CalendarCardProps) { return <DomainCard config={config} {...props}/>; }
