// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Enrollment, EnrollmentStatus, EnrollmentActivity, EnrollmentMetric, EnrollmentSettingsValues } from './types.js';
export interface EnrollmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly EnrollmentActivity[];
    emptyMessage?: string;
}
export function EnrollmentTimeline(props: EnrollmentTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
