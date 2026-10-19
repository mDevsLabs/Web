// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly RestaurantMenu[];
    metrics: readonly RestaurantMenuMetric[];
}
export function RestaurantMenuOverview(props: RestaurantMenuOverviewProps) { return <DomainOverview config={config} {...props}/>; }
