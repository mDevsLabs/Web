// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RouteDefinitionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RouteDefinitionStatus | '') => void;
}
export function RouteDefinitionFilters({ onStatusChange, ...props }: RouteDefinitionFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as RouteDefinitionStatus | '') : undefined}/>; }
