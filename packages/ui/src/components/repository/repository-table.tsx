// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Repository, RepositoryStatus, RepositoryActivity, RepositoryMetric, RepositorySettingsValues } from './types.js';
export interface RepositoryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Repository[];
    emptyMessage?: string;
}
export function RepositoryTable(props: RepositoryTableProps) { return <DomainTable config={config} {...props}/>; }
