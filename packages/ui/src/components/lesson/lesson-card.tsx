// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lesson, LessonStatus, LessonActivity, LessonMetric, LessonSettingsValues } from './types.js';
export interface LessonCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Lesson;
}
export function LessonCard(props: LessonCardProps) { return <DomainCard config={config} {...props}/>; }
