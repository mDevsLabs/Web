// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Flight, FlightStatus, FlightActivity, FlightMetric, FlightSettingsValues } from './types.js';
export interface FlightFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: FlightStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: FlightStatus | '') => void;
}
export function FlightFilters({ onStatusChange, ...props }: FlightFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as FlightStatus | '') : undefined}/>; }
