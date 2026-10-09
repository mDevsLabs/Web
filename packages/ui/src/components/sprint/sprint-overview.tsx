// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Sprint, SprintStatus, SprintActivity, SprintMetric, SprintSettingsValues } from './types.js';
export interface SprintOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Sprint[];
    metrics: readonly SprintMetric[];
}
export function SprintOverview(props: SprintOverviewProps) { return <DomainOverview config={config} {...props}/>; }
