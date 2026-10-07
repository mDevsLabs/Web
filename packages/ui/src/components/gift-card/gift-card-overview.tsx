// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { GiftCard, GiftCardStatus, GiftCardActivity, GiftCardMetric, GiftCardSettingsValues } from './types.js';
export interface GiftCardOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly GiftCard[];
    metrics: readonly GiftCardMetric[];
}
export function GiftCardOverview(props: GiftCardOverviewProps) { return <DomainOverview config={config} {...props}/>; }
