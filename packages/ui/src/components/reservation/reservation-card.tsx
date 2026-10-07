// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Reservation, ReservationStatus, ReservationActivity, ReservationMetric, ReservationSettingsValues } from './types.js';
export interface ReservationCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Reservation;
}
export function ReservationCard(props: ReservationCardProps) { return <DomainCard config={config} {...props}/>; }
