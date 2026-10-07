// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RouteDefinitionMetric[];
}
export function RouteDefinitionStats(props: RouteDefinitionStatsProps) { return <DomainStats config={config} {...props}/>; }
