// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Calendar, CalendarStatus, CalendarActivity, CalendarMetric, CalendarSettingsValues } from './types.js';
export interface CalendarSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CalendarSettingsValues;
    onChange: (key: keyof CalendarSettingsValues, value: boolean) => void;
}
export function CalendarSettings({ onChange, ...props }: CalendarSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CalendarSettingsValues, value)}/>; }
