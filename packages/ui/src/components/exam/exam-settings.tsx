// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Exam, ExamStatus, ExamActivity, ExamMetric, ExamSettingsValues } from './types.js';
export interface ExamSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ExamSettingsValues;
    onChange: (key: keyof ExamSettingsValues, value: boolean) => void;
}
export function ExamSettings({ onChange, ...props }: ExamSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ExamSettingsValues, value)}/>; }
