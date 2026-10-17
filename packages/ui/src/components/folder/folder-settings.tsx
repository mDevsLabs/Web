// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Folder, FolderStatus, FolderActivity, FolderMetric, FolderSettingsValues } from './types.js';
export interface FolderSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FolderSettingsValues;
    onChange: (key: keyof FolderSettingsValues, value: boolean) => void;
}
export function FolderSettings({ onChange, ...props }: FolderSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof FolderSettingsValues, value)}/>; }
