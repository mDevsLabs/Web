// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Integration, IntegrationStatus, IntegrationActivity, IntegrationMetric, IntegrationSettingsValues } from './types.js';
export interface IntegrationFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: IntegrationStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: IntegrationStatus | '') => void;
}
export function IntegrationFilters({ onStatusChange, ...props }: IntegrationFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as IntegrationStatus | '') : undefined}/>; }
