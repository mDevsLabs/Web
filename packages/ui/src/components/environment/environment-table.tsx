// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Environment, EnvironmentStatus, EnvironmentActivity, EnvironmentMetric, EnvironmentSettingsValues } from './types.js';
export interface EnvironmentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Environment[];
    emptyMessage?: string;
}
export function EnvironmentTable(props: EnvironmentTableProps) { return <DomainTable config={config} {...props}/>; }
