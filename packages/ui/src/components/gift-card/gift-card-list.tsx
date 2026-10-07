// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { GiftCard, GiftCardStatus, GiftCardActivity, GiftCardMetric, GiftCardSettingsValues } from './types.js';
export interface GiftCardListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly GiftCard[];
    onSelect?: (item: GiftCard) => void;
    emptyMessage?: string;
}
export function GiftCardList({ onSelect, ...props }: GiftCardListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as GiftCard) : undefined}/>; }
