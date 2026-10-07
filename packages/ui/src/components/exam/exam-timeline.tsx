// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Exam, ExamStatus, ExamActivity, ExamMetric, ExamSettingsValues } from './types.js';
export interface ExamTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ExamActivity[];
    emptyMessage?: string;
}
export function ExamTimeline(props: ExamTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
