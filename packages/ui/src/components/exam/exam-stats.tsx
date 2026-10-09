// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Exam, ExamStatus, ExamActivity, ExamMetric, ExamSettingsValues } from './types.js';
export interface ExamStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ExamMetric[];
}
export function ExamStats(props: ExamStatsProps) { return <DomainStats config={config} {...props}/>; }
