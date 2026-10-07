// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Tag, TagStatus, TagActivity, TagMetric, TagSettingsValues } from './types.js';
export interface TagStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TagMetric[];
}
export function TagStats(props: TagStatsProps) { return <DomainStats config={config} {...props}/>; }
