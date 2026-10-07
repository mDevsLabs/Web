// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { GiftCard, GiftCardStatus, GiftCardActivity, GiftCardMetric, GiftCardSettingsValues } from './types.js';
export interface GiftCardFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: GiftCardStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: GiftCardStatus | '') => void;
}
export function GiftCardFilters({ onStatusChange, ...props }: GiftCardFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as GiftCardStatus | '') : undefined}/>; }
