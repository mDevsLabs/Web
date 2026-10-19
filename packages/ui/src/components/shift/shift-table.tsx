// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shift, ShiftStatus, ShiftActivity, ShiftMetric, ShiftSettingsValues } from './types.js';
export interface ShiftTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shift[];
    emptyMessage?: string;
}
export function ShiftTable(props: ShiftTableProps) { return <DomainTable config={config} {...props}/>; }
