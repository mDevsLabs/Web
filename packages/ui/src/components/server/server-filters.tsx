// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Server, ServerStatus, ServerActivity, ServerMetric, ServerSettingsValues } from './types.js';
export interface ServerFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ServerStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ServerStatus | '') => void;
}
export function ServerFilters({ onStatusChange, ...props }: ServerFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as ServerStatus | '') : undefined}/>; }
