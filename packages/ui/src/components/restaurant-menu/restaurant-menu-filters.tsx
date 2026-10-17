// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RestaurantMenuStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RestaurantMenuStatus | '') => void;
}
export function RestaurantMenuFilters({ onStatusChange, ...props }: RestaurantMenuFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as RestaurantMenuStatus | '') : undefined}/>; }
