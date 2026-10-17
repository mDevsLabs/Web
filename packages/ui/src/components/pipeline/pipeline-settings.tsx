// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PipelineSettingsValues;
    onChange: (key: keyof PipelineSettingsValues, value: boolean) => void;
}
export function PipelineSettings({ onChange, ...props }: PipelineSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof PipelineSettingsValues, value)}/>; }
