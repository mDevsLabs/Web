// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lesson, LessonStatus, LessonActivity, LessonMetric, LessonSettingsValues } from './types.js';
export interface LessonSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LessonSettingsValues;
    onChange: (key: keyof LessonSettingsValues, value: boolean) => void;
}
export function LessonSettings({ onChange, ...props }: LessonSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof LessonSettingsValues, value)}/>; }
