// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Reservation, ReservationStatus, ReservationActivity, ReservationMetric, ReservationSettingsValues } from './types.js';
export interface ReservationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Reservation[];
    onSelect?: (item: Reservation) => void;
    emptyMessage?: string;
}
export function ReservationList({ onSelect, ...props }: ReservationListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Reservation) : undefined}/>; }
