// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RestaurantMenu, RestaurantMenuStatus, RestaurantMenuActivity, RestaurantMenuMetric, RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function RestaurantMenuEmptyState(props: RestaurantMenuEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
