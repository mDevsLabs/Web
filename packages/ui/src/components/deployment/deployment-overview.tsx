// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deployment, DeploymentStatus, DeploymentActivity, DeploymentMetric, DeploymentSettingsValues } from './types.js';
export interface DeploymentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deployment[];
    metrics: readonly DeploymentMetric[];
}
export function DeploymentOverview(props: DeploymentOverviewProps) { return <DomainOverview config={config} {...props}/>; }
