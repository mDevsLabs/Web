// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Destination, DestinationStatus, DestinationActivity, DestinationMetric, DestinationSettingsValues } from './types.js';
export interface DestinationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DestinationSettingsValues;
    onChange: (key: keyof DestinationSettingsValues, value: boolean) => void;
}
export function DestinationSettings({ onChange, ...props }: DestinationSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof DestinationSettingsValues, value)}/>; }
