// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Calendar, CalendarStatus, CalendarActivity, CalendarMetric, CalendarSettingsValues } from './types.js';
export interface CalendarEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function CalendarEmptyState(props: CalendarEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
