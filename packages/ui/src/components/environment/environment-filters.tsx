// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Environment, EnvironmentStatus, EnvironmentActivity, EnvironmentMetric, EnvironmentSettingsValues } from './types.js';
export interface EnvironmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: EnvironmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: EnvironmentStatus | '') => void;
}
export function EnvironmentFilters({ onStatusChange, ...props }: EnvironmentFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as EnvironmentStatus | '') : undefined}/>; }
