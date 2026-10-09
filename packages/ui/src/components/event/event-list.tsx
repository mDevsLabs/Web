// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Event, EventStatus, EventActivity, EventMetric, EventSettingsValues } from './types.js';
export interface EventListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Event[];
    onSelect?: (item: Event) => void;
    emptyMessage?: string;
}
export function EventList({ onSelect, ...props }: EventListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Event) : undefined}/>; }
