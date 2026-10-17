// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Pipeline[];
    onSelect?: (item: Pipeline) => void;
    emptyMessage?: string;
}
export function PipelineList({ onSelect, ...props }: PipelineListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Pipeline) : undefined}/>; }
