// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Database, DatabaseStatus, DatabaseActivity, DatabaseMetric, DatabaseSettingsValues } from './types.js';
export interface DatabaseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Database[];
    onSelect?: (item: Database) => void;
    emptyMessage?: string;
}
export function DatabaseList({ onSelect, ...props }: DatabaseListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Database) : undefined}/>; }
