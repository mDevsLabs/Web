// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Tag, TagStatus, TagActivity, TagMetric, TagSettingsValues } from './types.js';
export interface TagListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Tag[];
    onSelect?: (item: Tag) => void;
    emptyMessage?: string;
}
export function TagList({ onSelect, ...props }: TagListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Tag) : undefined}/>; }
