// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deployment, DeploymentStatus, DeploymentActivity, DeploymentMetric, DeploymentSettingsValues } from './types.js';
export interface DeploymentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function DeploymentEmptyState(props: DeploymentEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
