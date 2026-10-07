// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Document, DocumentStatus, DocumentActivity, DocumentMetric, DocumentSettingsValues } from './types.js';
export interface DocumentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DocumentMetric[];
}
export function DocumentStats(props: DocumentStatsProps) { return <DomainStats config={config} {...props}/>; }
