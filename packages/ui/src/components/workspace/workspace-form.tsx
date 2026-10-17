// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workspace, WorkspaceStatus, WorkspaceActivity, WorkspaceMetric, WorkspaceSettingsValues } from './types.js';
export interface WorkspaceFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Workspace>;
    onSubmit: (value: Omit<Workspace, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function WorkspaceForm({ onSubmit, ...props }: WorkspaceFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Workspace, 'id'>)}/>; }
