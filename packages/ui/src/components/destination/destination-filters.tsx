// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Destination, DestinationStatus, DestinationActivity, DestinationMetric, DestinationSettingsValues } from './types.js';
export interface DestinationFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: DestinationStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: DestinationStatus | '') => void;
}
export function DestinationFilters({ onStatusChange, ...props }: DestinationFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as DestinationStatus | '') : undefined}/>; }
