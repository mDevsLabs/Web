// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Cart, CartStatus, CartActivity, CartMetric, CartSettingsValues } from './types.js';
export interface CartFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CartStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CartStatus | '') => void;
}
export function CartFilters({ onStatusChange, ...props }: CartFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as CartStatus | '') : undefined}/>; }
