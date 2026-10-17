// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RestaurantMenu[];
    onSelect?: (item: RestaurantMenu) => void;
    emptyMessage?: string;
}
export function RestaurantMenuList({ onSelect, ...props }: RestaurantMenuListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as RestaurantMenu) : undefined}/>; }
