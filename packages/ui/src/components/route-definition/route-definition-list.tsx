// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RouteDefinition[];
    onSelect?: (item: RouteDefinition) => void;
    emptyMessage?: string;
}
export function RouteDefinitionList({ onSelect, ...props }: RouteDefinitionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as RouteDefinition) : undefined}/>; }
