// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Server, ServerStatus, ServerActivity, ServerMetric, ServerSettingsValues } from './types.js';
export interface ServerStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ServerMetric[];
}
export function ServerStats(props: ServerStatsProps) { return <DomainStats config={config} {...props}/>; }
