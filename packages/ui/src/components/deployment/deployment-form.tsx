// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deployment, DeploymentStatus, DeploymentActivity, DeploymentMetric, DeploymentSettingsValues } from './types.js';
export interface DeploymentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Deployment>;
    onSubmit: (value: Omit<Deployment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function DeploymentForm({ onSubmit, ...props }: DeploymentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Deployment, 'id'>)}/>; }
