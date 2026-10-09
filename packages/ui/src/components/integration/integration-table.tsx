// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Integration, IntegrationStatus, IntegrationActivity, IntegrationMetric, IntegrationSettingsValues } from './types.js';
export interface IntegrationTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Integration[];
    emptyMessage?: string;
}
export function IntegrationTable(props: IntegrationTableProps) { return <DomainTable config={config} {...props}/>; }
