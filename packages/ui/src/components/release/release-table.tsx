// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Release, ReleaseStatus, ReleaseActivity, ReleaseMetric, ReleaseSettingsValues } from './types.js';
export interface ReleaseTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Release[];
    emptyMessage?: string;
}
export function ReleaseTable(props: ReleaseTableProps) { return <DomainTable config={config} {...props}/>; }
