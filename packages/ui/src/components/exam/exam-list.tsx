// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Exam, ExamStatus, ExamActivity, ExamMetric, ExamSettingsValues } from './types.js';
export interface ExamListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Exam[];
    onSelect?: (item: Exam) => void;
    emptyMessage?: string;
}
export function ExamList({ onSelect, ...props }: ExamListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Exam) : undefined}/>; }
