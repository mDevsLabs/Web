// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Repository, RepositoryStatus, RepositoryActivity, RepositoryMetric, RepositorySettingsValues } from './types.js';
export interface RepositorySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RepositorySettingsValues;
    onChange: (key: keyof RepositorySettingsValues, value: boolean) => void;
}
export function RepositorySettings({ onChange, ...props }: RepositorySettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof RepositorySettingsValues, value)}/>; }
