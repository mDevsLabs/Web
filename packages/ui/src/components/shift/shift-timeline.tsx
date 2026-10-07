// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shift, ShiftStatus, ShiftActivity, ShiftMetric, ShiftSettingsValues } from './types.js';
export interface ShiftTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ShiftActivity[];
    emptyMessage?: string;
}
export function ShiftTimeline(props: ShiftTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
