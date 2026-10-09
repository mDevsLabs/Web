// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deal, DealStatus, DealActivity, DealMetric, DealSettingsValues } from './types.js';
export interface DealTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deal[];
    emptyMessage?: string;
}
export function DealTable(props: DealTableProps) { return <DomainTable config={config} {...props}/>; }
