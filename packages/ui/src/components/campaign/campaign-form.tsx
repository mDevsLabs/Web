// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Campaign, CampaignStatus, CampaignActivity, CampaignMetric, CampaignSettingsValues } from './types.js';
export interface CampaignFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Campaign>;
    onSubmit: (value: Omit<Campaign, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CampaignForm({ onSubmit, ...props }: CampaignFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Campaign, 'id'>)}/>; }
