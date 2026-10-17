// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BuildJob, BuildJobStatus, BuildJobActivity, BuildJobMetric, BuildJobSettingsValues } from './types.js';
export interface BuildJobCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: BuildJob;
}
export function BuildJobCard(props: BuildJobCardProps) { return <DomainCard config={config} {...props}/>; }
