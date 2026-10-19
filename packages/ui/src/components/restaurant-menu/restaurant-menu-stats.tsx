// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RestaurantMenuMetric[];
}
export function RestaurantMenuStats(props: RestaurantMenuStatsProps) { return <DomainStats config={config} {...props}/>; }
