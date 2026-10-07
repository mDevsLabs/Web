// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workspace, WorkspaceStatus, WorkspaceActivity, WorkspaceMetric, WorkspaceSettingsValues } from './types.js';
export interface WorkspaceSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WorkspaceSettingsValues;
    onChange: (key: keyof WorkspaceSettingsValues, value: boolean) => void;
}
export function WorkspaceSettings({ onChange, ...props }: WorkspaceSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof WorkspaceSettingsValues, value)}/>; }
