// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Destination, DestinationStatus, DestinationActivity, DestinationMetric, DestinationSettingsValues } from './types.js';
export interface DestinationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DestinationMetric[];
}
export function DestinationStats(props: DestinationStatsProps) { return <DomainStats config={config} {...props}/>; }
