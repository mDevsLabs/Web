// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TravelItinerary, TravelItineraryStatus, TravelItineraryActivity, TravelItineraryMetric, TravelItinerarySettingsValues } from './types.js';
export interface TravelItinerarySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TravelItinerarySettingsValues;
    onChange: (key: keyof TravelItinerarySettingsValues, value: boolean) => void;
}
export function TravelItinerarySettings({ onChange, ...props }: TravelItinerarySettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TravelItinerarySettingsValues, value)}/>; }
