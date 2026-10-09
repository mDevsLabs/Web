// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { ApiEndpoint, ApiEndpointStatus, ApiEndpointActivity, ApiEndpointMetric, ApiEndpointSettingsValues } from './types.js';
export interface ApiEndpointStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ApiEndpointMetric[];
}
export function ApiEndpointStats(props: ApiEndpointStatsProps) { return <DomainStats config={config} {...props}/>; }
