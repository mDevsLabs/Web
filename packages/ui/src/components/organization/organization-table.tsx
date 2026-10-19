// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Organization, OrganizationStatus, OrganizationActivity, OrganizationMetric, OrganizationSettingsValues } from './types.js';
export interface OrganizationTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Organization[];
    emptyMessage?: string;
}
export function OrganizationTable(props: OrganizationTableProps) { return <DomainTable config={config} {...props}/>; }
