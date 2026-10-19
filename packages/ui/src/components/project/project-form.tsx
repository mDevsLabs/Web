// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Project, ProjectStatus, ProjectActivity, ProjectMetric, ProjectSettingsValues } from './types.js';
export interface ProjectFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Project>;
    onSubmit: (value: Omit<Project, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ProjectForm({ onSubmit, ...props }: ProjectFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Project, 'id'>)}/>; }
