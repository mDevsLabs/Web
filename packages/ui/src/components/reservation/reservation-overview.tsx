// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Reservation, ReservationStatus, ReservationActivity, ReservationMetric, ReservationSettingsValues } from './types.js';
export interface ReservationOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Reservation[];
    metrics: readonly ReservationMetric[];
}
export function ReservationOverview(props: ReservationOverviewProps) { return <DomainOverview config={config} {...props}/>; }
