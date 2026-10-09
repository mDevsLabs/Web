// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Flight, FlightStatus, FlightActivity, FlightMetric, FlightSettingsValues } from './types.js';
export interface FlightListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Flight[];
    onSelect?: (item: Flight) => void;
    emptyMessage?: string;
}
export function FlightList({ onSelect, ...props }: FlightListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Flight) : undefined}/>; }
