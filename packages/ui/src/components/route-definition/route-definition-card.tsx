// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: RouteDefinition;
}
export function RouteDefinitionCard(props: RouteDefinitionCardProps) { return <DomainCard config={config} {...props}/>; }
