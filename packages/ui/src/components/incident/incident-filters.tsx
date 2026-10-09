// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Incident, IncidentStatus, IncidentActivity, IncidentMetric, IncidentSettingsValues } from './types.js';
export interface IncidentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: IncidentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: IncidentStatus | '') => void;
}
export function IncidentFilters({ onStatusChange, ...props }: IncidentFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as IncidentStatus | '') : undefined}/>; }
