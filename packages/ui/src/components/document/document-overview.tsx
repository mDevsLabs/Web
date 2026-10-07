// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Document, DocumentStatus, DocumentActivity, DocumentMetric, DocumentSettingsValues } from './types.js';
export interface DocumentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Document[];
    metrics: readonly DocumentMetric[];
}
export function DocumentOverview(props: DocumentOverviewProps) { return <DomainOverview config={config} {...props}/>; }
