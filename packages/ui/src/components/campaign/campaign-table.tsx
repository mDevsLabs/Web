// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Campaign, CampaignStatus, CampaignActivity, CampaignMetric, CampaignSettingsValues } from './types.js';
export interface CampaignTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Campaign[];
    emptyMessage?: string;
}
export function CampaignTable(props: CampaignTableProps) { return <DomainTable config={config} {...props}/>; }
