// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Reservation, ReservationStatus, ReservationActivity, ReservationMetric, ReservationSettingsValues } from './types.js';
export interface ReservationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ReservationMetric[];
}
export function ReservationStats(props: ReservationStatsProps) { return <DomainStats config={config} {...props}/>; }
