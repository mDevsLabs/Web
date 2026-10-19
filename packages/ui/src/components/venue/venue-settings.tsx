// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: VenueSettingsValues;
    onChange: (key: keyof VenueSettingsValues, value: boolean) => void;
}
export function VenueSettings({ onChange, ...props }: VenueSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof VenueSettingsValues, value)}/>; }
