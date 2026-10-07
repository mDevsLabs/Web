// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Course, CourseStatus, CourseActivity, CourseMetric, CourseSettingsValues } from './types.js';
export interface CourseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Course[];
    metrics: readonly CourseMetric[];
}
export function CourseOverview(props: CourseOverviewProps) { return <DomainOverview config={config} {...props}/>; }
