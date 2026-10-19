// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RestaurantMenu[];
    emptyMessage?: string;
}
export function RestaurantMenuTable(props: RestaurantMenuTableProps) { return <DomainTable config={config} {...props}/>; }
