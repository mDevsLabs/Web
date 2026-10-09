// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lesson, LessonStatus, LessonActivity, LessonMetric, LessonSettingsValues } from './types.js';
export interface LessonListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lesson[];
    onSelect?: (item: Lesson) => void;
    emptyMessage?: string;
}
export function LessonList({ onSelect, ...props }: LessonListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Lesson) : undefined}/>; }
