// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Organization, OrganizationStatus, OrganizationActivity, OrganizationMetric, OrganizationSettingsValues } from './types.js';
export interface OrganizationFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: OrganizationStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: OrganizationStatus | '') => void;
}
export function OrganizationFilters({ onStatusChange, ...props }: OrganizationFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as OrganizationStatus | '') : undefined}/>; }
