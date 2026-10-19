// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RouteDefinition[];
    emptyMessage?: string;
}
export function RouteDefinitionTable(props: RouteDefinitionTableProps) { return <DomainTable config={config} {...props}/>; }
