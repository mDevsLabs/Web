// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deployment, DeploymentStatus, DeploymentActivity, DeploymentMetric, DeploymentSettingsValues } from './types.js';
export interface DeploymentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Deployment;
}
export function DeploymentCard(props: DeploymentCardProps) { return <DomainCard config={config} {...props}/>; }
