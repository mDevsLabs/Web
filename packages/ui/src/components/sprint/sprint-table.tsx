// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Sprint, SprintStatus, SprintActivity, SprintMetric, SprintSettingsValues } from './types.js';
export interface SprintTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Sprint[];
    emptyMessage?: string;
}
export function SprintTable(props: SprintTableProps) { return <DomainTable config={config} {...props}/>; }
