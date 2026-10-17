// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Flight, FlightStatus, FlightActivity, FlightMetric, FlightSettingsValues } from './types.js';
export interface FlightSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FlightSettingsValues;
    onChange: (key: keyof FlightSettingsValues, value: boolean) => void;
}
export function FlightSettings({ onChange, ...props }: FlightSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof FlightSettingsValues, value)}/>; }
