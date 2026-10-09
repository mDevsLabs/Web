// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { HotelRoom, HotelRoomStatus, HotelRoomActivity, HotelRoomMetric, HotelRoomSettingsValues } from './types.js';
export interface HotelRoomSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: HotelRoomSettingsValues;
    onChange: (key: keyof HotelRoomSettingsValues, value: boolean) => void;
}
export function HotelRoomSettings({ onChange, ...props }: HotelRoomSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof HotelRoomSettingsValues, value)}/>; }
