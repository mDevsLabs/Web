// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Pipeline[];
    emptyMessage?: string;
}
export function PipelineTable(props: PipelineTableProps) { return <DomainTable config={config} {...props}/>; }
