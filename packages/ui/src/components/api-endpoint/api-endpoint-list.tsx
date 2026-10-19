// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { ApiEndpoint, ApiEndpointStatus, ApiEndpointActivity, ApiEndpointMetric, ApiEndpointSettingsValues } from './types.js';
export interface ApiEndpointListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly ApiEndpoint[];
    onSelect?: (item: ApiEndpoint) => void;
    emptyMessage?: string;
}
export function ApiEndpointList({ onSelect, ...props }: ApiEndpointListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as ApiEndpoint) : undefined}/>; }
