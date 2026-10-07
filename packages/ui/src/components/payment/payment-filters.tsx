// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payment, PaymentStatus, PaymentActivity, PaymentMetric, PaymentSettingsValues } from './types.js';
export interface PaymentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PaymentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PaymentStatus | '') => void;
}
export function PaymentFilters({ onStatusChange, ...props }: PaymentFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as PaymentStatus | '') : undefined}/>; }
