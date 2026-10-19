// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { ApiEndpoint, ApiEndpointStatus, ApiEndpointActivity, ApiEndpointMetric, ApiEndpointSettingsValues } from './types.js';
export interface ApiEndpointOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly ApiEndpoint[];
    metrics: readonly ApiEndpointMetric[];
}
export function ApiEndpointOverview(props: ApiEndpointOverviewProps) { return <DomainOverview config={config} {...props}/>; }
