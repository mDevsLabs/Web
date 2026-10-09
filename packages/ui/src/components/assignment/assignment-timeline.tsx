// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Assignment, AssignmentStatus, AssignmentActivity, AssignmentMetric, AssignmentSettingsValues } from './types.js';
export interface AssignmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly AssignmentActivity[];
    emptyMessage?: string;
}
export function AssignmentTimeline(props: AssignmentTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
