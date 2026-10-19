// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Database, DatabaseStatus, DatabaseActivity, DatabaseMetric, DatabaseSettingsValues } from './types.js';
export interface DatabaseFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: DatabaseStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: DatabaseStatus | '') => void;
}
export function DatabaseFilters({ onStatusChange, ...props }: DatabaseFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as DatabaseStatus | '') : undefined}/>; }
