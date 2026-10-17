// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Course, CourseStatus, CourseActivity, CourseMetric, CourseSettingsValues } from './types.js';
export interface CourseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Course[];
    onSelect?: (item: Course) => void;
    emptyMessage?: string;
}
export function CourseList({ onSelect, ...props }: CourseListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Course) : undefined}/>; }
