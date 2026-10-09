// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workspace, WorkspaceStatus, WorkspaceActivity, WorkspaceMetric, WorkspaceSettingsValues } from './types.js';
export interface WorkspaceStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly WorkspaceMetric[];
}
export function WorkspaceStats(props: WorkspaceStatsProps) { return <DomainStats config={config} {...props}/>; }
