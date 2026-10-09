// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deal, DealStatus, DealActivity, DealMetric, DealSettingsValues } from './types.js';
export interface DealListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deal[];
    onSelect?: (item: Deal) => void;
    emptyMessage?: string;
}
export function DealList({ onSelect, ...props }: DealListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Deal) : undefined}/>; }
