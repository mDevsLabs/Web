// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Reservation, ReservationStatus, ReservationActivity, ReservationMetric, ReservationSettingsValues } from './types.js';
export interface ReservationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReservationSettingsValues;
    onChange: (key: keyof ReservationSettingsValues, value: boolean) => void;
}
export function ReservationSettings({ onChange, ...props }: ReservationSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ReservationSettingsValues, value)}/>; }
