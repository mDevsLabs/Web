// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Course, CourseStatus, CourseActivity, CourseMetric, CourseSettingsValues } from './types.js';
export interface CourseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CourseActivity[];
    emptyMessage?: string;
}
export function CourseTimeline(props: CourseTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
