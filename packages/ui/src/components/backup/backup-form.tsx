// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Backup, BackupStatus, BackupActivity, BackupMetric, BackupSettingsValues } from './types.js';
export interface BackupFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Backup>;
    onSubmit: (value: Omit<Backup, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function BackupForm({ onSubmit, ...props }: BackupFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Backup, 'id'>)}/>; }
