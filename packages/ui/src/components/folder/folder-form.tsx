// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Folder, FolderStatus, FolderActivity, FolderMetric, FolderSettingsValues } from './types.js';
export interface FolderFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Folder>;
    onSubmit: (value: Omit<Folder, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function FolderForm({ onSubmit, ...props }: FolderFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Folder, 'id'>)}/>; }
