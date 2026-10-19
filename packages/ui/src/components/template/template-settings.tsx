// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Template, TemplateStatus, TemplateActivity, TemplateMetric, TemplateSettingsValues } from './types.js';
export interface TemplateSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TemplateSettingsValues;
    onChange: (key: keyof TemplateSettingsValues, value: boolean) => void;
}
export function TemplateSettings({ onChange, ...props }: TemplateSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TemplateSettingsValues, value)}/>; }
