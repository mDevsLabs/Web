// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Monitor, MonitorStatus, MonitorActivity, MonitorMetric, MonitorSettingsValues } from './types.js';
export interface MonitorFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MonitorStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MonitorStatus | '') => void;
}
export function MonitorFilters({ onStatusChange, ...props }: MonitorFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as MonitorStatus | '') : undefined}/>; }
