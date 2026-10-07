// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { GiftCard, GiftCardStatus, GiftCardActivity, GiftCardMetric, GiftCardSettingsValues } from './types.js';
export interface GiftCardStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly GiftCardMetric[];
}
export function GiftCardStats(props: GiftCardStatsProps) { return <DomainStats config={config} {...props}/>; }
