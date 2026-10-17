// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Team, TeamStatus, TeamActivity, TeamMetric, TeamSettingsValues } from './types.js';
export interface TeamSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TeamSettingsValues;
    onChange: (key: keyof TeamSettingsValues, value: boolean) => void;
}
export function TeamSettings({ onChange, ...props }: TeamSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TeamSettingsValues, value)}/>; }
