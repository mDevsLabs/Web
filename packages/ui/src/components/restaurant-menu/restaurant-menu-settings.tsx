// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RestaurantMenuSettingsValues;
    onChange: (key: keyof RestaurantMenuSettingsValues, value: boolean) => void;
}
export function RestaurantMenuSettings({ onChange, ...props }: RestaurantMenuSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof RestaurantMenuSettingsValues, value)}/>; }
