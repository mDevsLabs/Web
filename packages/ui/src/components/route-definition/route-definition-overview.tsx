// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RouteDefinition[];
    metrics: readonly RouteDefinitionMetric[];
}
export function RouteDefinitionOverview(props: RouteDefinitionOverviewProps) { return <DomainOverview config={config} {...props}/>; }
