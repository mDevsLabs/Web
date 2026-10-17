// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Project, ProjectStatus, ProjectActivity, ProjectMetric, ProjectSettingsValues } from './types.js';
export interface ProjectSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ProjectSettingsValues;
    onChange: (key: keyof ProjectSettingsValues, value: boolean) => void;
}
export function ProjectSettings({ onChange, ...props }: ProjectSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ProjectSettingsValues, value)}/>; }
