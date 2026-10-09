// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Collection, CollectionStatus, CollectionActivity, CollectionMetric, CollectionSettingsValues } from './types.js';
export interface CollectionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Collection[];
    emptyMessage?: string;
}
export function CollectionTable(props: CollectionTableProps) { return <DomainTable config={config} {...props}/>; }
