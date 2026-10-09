// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Destination, DestinationStatus, DestinationActivity, DestinationMetric, DestinationSettingsValues } from './types.js';
export interface DestinationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Destination[];
    onSelect?: (item: Destination) => void;
    emptyMessage?: string;
}
export function DestinationList({ onSelect, ...props }: DestinationListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Destination) : undefined}/>; }
