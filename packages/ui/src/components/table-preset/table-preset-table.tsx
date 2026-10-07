// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TablePreset, TablePresetStatus, TablePresetActivity, TablePresetMetric, TablePresetSettingsValues } from './types.js';
export interface TablePresetTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TablePreset[];
    emptyMessage?: string;
}
export function TablePresetTable(props: TablePresetTableProps) { return <DomainTable config={config} {...props}/>; }
