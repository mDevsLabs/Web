// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Backup, BackupStatus, BackupActivity, BackupMetric, BackupSettingsValues } from './types.js';
export interface BackupSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BackupSettingsValues;
    onChange: (key: keyof BackupSettingsValues, value: boolean) => void;
}
export function BackupSettings({ onChange, ...props }: BackupSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof BackupSettingsValues, value)}/>; }
