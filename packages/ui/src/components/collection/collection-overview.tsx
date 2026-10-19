// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Collection, CollectionStatus, CollectionActivity, CollectionMetric, CollectionSettingsValues } from './types.js';
export interface CollectionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Collection[];
    metrics: readonly CollectionMetric[];
}
export function CollectionOverview(props: CollectionOverviewProps) { return <DomainOverview config={config} {...props}/>; }
