// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lesson, LessonStatus, LessonActivity, LessonMetric, LessonSettingsValues } from './types.js';
export interface LessonStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly LessonMetric[];
}
export function LessonStats(props: LessonStatsProps) { return <DomainStats config={config} {...props}/>; }
