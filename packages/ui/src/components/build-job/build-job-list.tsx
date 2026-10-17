// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BuildJob, BuildJobStatus, BuildJobActivity, BuildJobMetric, BuildJobSettingsValues } from './types.js';
export interface BuildJobListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BuildJob[];
    onSelect?: (item: BuildJob) => void;
    emptyMessage?: string;
}
export function BuildJobList({ onSelect, ...props }: BuildJobListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as BuildJob) : undefined}/>; }
