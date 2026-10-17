// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Campaign, CampaignStatus, CampaignActivity, CampaignMetric, CampaignSettingsValues } from './types.js';
export interface CampaignListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Campaign[];
    onSelect?: (item: Campaign) => void;
    emptyMessage?: string;
}
export function CampaignList({ onSelect, ...props }: CampaignListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Campaign) : undefined}/>; }
