// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deployment, DeploymentStatus, DeploymentActivity, DeploymentMetric, DeploymentSettingsValues } from './types.js';
export interface DeploymentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deployment[];
    onSelect?: (item: Deployment) => void;
    emptyMessage?: string;
}
export function DeploymentList({ onSelect, ...props }: DeploymentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Deployment) : undefined}/>; }
