// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Collection, CollectionStatus, CollectionActivity, CollectionMetric, CollectionSettingsValues } from './types.js';
export interface CollectionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Collection[];
    onSelect?: (item: Collection) => void;
    emptyMessage?: string;
}
export function CollectionList({ onSelect, ...props }: CollectionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Collection) : undefined}/>; }
