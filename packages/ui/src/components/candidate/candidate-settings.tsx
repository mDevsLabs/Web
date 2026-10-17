// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Candidate, CandidateStatus, CandidateActivity, CandidateMetric, CandidateSettingsValues } from './types.js';
export interface CandidateSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CandidateSettingsValues;
    onChange: (key: keyof CandidateSettingsValues, value: boolean) => void;
}
export function CandidateSettings({ onChange, ...props }: CandidateSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CandidateSettingsValues, value)}/>; }
