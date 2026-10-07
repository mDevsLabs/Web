// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Booking, BookingStatus, BookingActivity, BookingMetric, BookingSettingsValues } from './types.js';
export interface BookingEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function BookingEmptyState(props: BookingEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
