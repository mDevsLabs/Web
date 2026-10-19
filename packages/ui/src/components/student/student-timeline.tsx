// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Student, StudentStatus, StudentActivity, StudentMetric, StudentSettingsValues } from './types.js';
export interface StudentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly StudentActivity[];
    emptyMessage?: string;
}
export function StudentTimeline(props: StudentTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
