// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Venue, VenueStatus, VenueActivity, VenueMetric, VenueSettingsValues } from './types.js';
export interface VenueListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Venue[];
    onSelect?: (item: Venue) => void;
    emptyMessage?: string;
}
export function VenueList({ onSelect, ...props }: VenueListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Venue) : undefined}/>; }
