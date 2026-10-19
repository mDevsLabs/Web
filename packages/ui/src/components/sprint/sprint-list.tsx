// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Sprint, SprintStatus, SprintActivity, SprintMetric, SprintSettingsValues } from './types.js';
export interface SprintListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Sprint[];
    onSelect?: (item: Sprint) => void;
    emptyMessage?: string;
}
export function SprintList({ onSelect, ...props }: SprintListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Sprint) : undefined}/>; }
