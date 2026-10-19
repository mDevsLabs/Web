// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Campaign, CampaignStatus, CampaignActivity, CampaignMetric, CampaignSettingsValues } from './types.js';
export interface CampaignSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CampaignSettingsValues;
    onChange: (key: keyof CampaignSettingsValues, value: boolean) => void;
}
export function CampaignSettings({ onChange, ...props }: CampaignSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof CampaignSettingsValues, value)}/>; }
