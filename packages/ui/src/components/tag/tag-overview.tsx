// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Tag, TagStatus, TagActivity, TagMetric, TagSettingsValues } from './types.js';
export interface TagOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Tag[];
    metrics: readonly TagMetric[];
}
export function TagOverview(props: TagOverviewProps) { return <DomainOverview config={config} {...props}/>; }
