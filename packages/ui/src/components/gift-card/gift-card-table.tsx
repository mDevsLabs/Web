// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { GiftCard, GiftCardStatus, GiftCardActivity, GiftCardMetric, GiftCardSettingsValues } from './types.js';
export interface GiftCardTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly GiftCard[];
    emptyMessage?: string;
}
export function GiftCardTable(props: GiftCardTableProps) { return <DomainTable config={config} {...props}/>; }
