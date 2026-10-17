// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Meeting, MeetingStatus, MeetingActivity, MeetingMetric, MeetingSettingsValues } from './types.js';
export interface MeetingSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MeetingSettingsValues;
    onChange: (key: keyof MeetingSettingsValues, value: boolean) => void;
}
export function MeetingSettings({ onChange, ...props }: MeetingSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof MeetingSettingsValues, value)}/>; }
