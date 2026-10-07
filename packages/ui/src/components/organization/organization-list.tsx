// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Organization, OrganizationStatus, OrganizationActivity, OrganizationMetric, OrganizationSettingsValues } from './types.js';
export interface OrganizationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Organization[];
    onSelect?: (item: Organization) => void;
    emptyMessage?: string;
}
export function OrganizationList({ onSelect, ...props }: OrganizationListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Organization) : undefined}/>; }
