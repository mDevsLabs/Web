// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SavedFilter, SavedFilterStatus, SavedFilterActivity, SavedFilterMetric, SavedFilterSettingsValues } from './types.js';
export interface SavedFilterTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SavedFilter[];
    emptyMessage?: string;
}
export function SavedFilterTable(props: SavedFilterTableProps) { return <DomainTable config={config} {...props}/>; }
