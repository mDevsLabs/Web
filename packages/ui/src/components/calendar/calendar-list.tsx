// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Calendar, CalendarStatus, CalendarActivity, CalendarMetric, CalendarSettingsValues } from './types.js';
export interface CalendarListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Calendar[];
    onSelect?: (item: Calendar) => void;
    emptyMessage?: string;
}
export function CalendarList({ onSelect, ...props }: CalendarListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Calendar) : undefined}/>; }
