// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Event, EventStatus, EventActivity, EventMetric, EventSettingsValues } from './types.js';
export interface EventSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EventSettingsValues;
    onChange: (key: keyof EventSettingsValues, value: boolean) => void;
}
export function EventSettings({ onChange, ...props }: EventSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof EventSettingsValues, value)}/>; }
