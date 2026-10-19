// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Repository, RepositoryStatus, RepositoryActivity, RepositoryMetric, RepositorySettingsValues } from './types.js';
export interface RepositoryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Repository[];
    onSelect?: (item: Repository) => void;
    emptyMessage?: string;
}
export function RepositoryList({ onSelect, ...props }: RepositoryListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Repository) : undefined}/>; }
