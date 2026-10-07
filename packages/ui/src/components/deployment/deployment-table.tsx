// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deployment, DeploymentStatus, DeploymentActivity, DeploymentMetric, DeploymentSettingsValues } from './types.js';
export interface DeploymentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deployment[];
    emptyMessage?: string;
}
export function DeploymentTable(props: DeploymentTableProps) { return <DomainTable config={config} {...props}/>; }
