// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lesson, LessonStatus, LessonActivity, LessonMetric, LessonSettingsValues } from './types.js';
export interface LessonTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lesson[];
    emptyMessage?: string;
}
export function LessonTable(props: LessonTableProps) { return <DomainTable config={config} {...props}/>; }
