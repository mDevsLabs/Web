// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Cart, CartStatus, CartActivity, CartMetric, CartSettingsValues } from './types.js';
export interface CartListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Cart[];
    onSelect?: (item: Cart) => void;
    emptyMessage?: string;
}
export function CartList({ onSelect, ...props }: CartListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Cart) : undefined}/>; }
