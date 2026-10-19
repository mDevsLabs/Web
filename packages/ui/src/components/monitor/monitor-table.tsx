// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Monitor, MonitorStatus, MonitorActivity, MonitorMetric, MonitorSettingsValues } from './types.js';
export interface MonitorTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Monitor[];
    emptyMessage?: string;
}
export function MonitorTable(props: MonitorTableProps) { return <DomainTable config={config} {...props}/>; }
