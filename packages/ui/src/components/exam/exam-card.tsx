// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Exam, ExamStatus, ExamActivity, ExamMetric, ExamSettingsValues } from './types.js';
export interface ExamCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Exam;
}
export function ExamCard(props: ExamCardProps) { return <DomainCard config={config} {...props}/>; }
