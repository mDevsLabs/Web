// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { ApiEndpoint, ApiEndpointStatus, ApiEndpointActivity, ApiEndpointMetric, ApiEndpointSettingsValues } from './types.js';
export interface ApiEndpointFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ApiEndpointStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ApiEndpointStatus | '') => void;
}
export function ApiEndpointFilters({ onStatusChange, ...props }: ApiEndpointFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as ApiEndpointStatus | '') : undefined}/>; }
