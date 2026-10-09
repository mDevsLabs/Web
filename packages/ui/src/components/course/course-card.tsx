// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Course, CourseStatus, CourseActivity, CourseMetric, CourseSettingsValues } from './types.js';
export interface CourseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Course;
}
export function CourseCard(props: CourseCardProps) { return <DomainCard config={config} {...props}/>; }
