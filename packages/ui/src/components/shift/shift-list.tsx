// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shift, ShiftStatus, ShiftActivity, ShiftMetric, ShiftSettingsValues } from './types.js';
export interface ShiftListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shift[];
    onSelect?: (item: Shift) => void;
    emptyMessage?: string;
}
export function ShiftList({ onSelect, ...props }: ShiftListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Shift) : undefined}/>; }
