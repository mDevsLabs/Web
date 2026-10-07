// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Return, ReturnStatus, ReturnActivity, ReturnMetric, ReturnSettingsValues } from './types.js';
export interface ReturnListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Return[];
    onSelect?: (item: Return) => void;
    emptyMessage?: string;
}
export function ReturnList({ onSelect, ...props }: ReturnListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Return) : undefined}/>; }
