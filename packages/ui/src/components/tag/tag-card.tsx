// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Tag, TagStatus, TagActivity, TagMetric, TagSettingsValues } from './types.js';
export interface TagCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Tag;
}
export function TagCard(props: TagCardProps) { return <DomainCard config={config} {...props}/>; }
