// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Deal, DealStatus, DealActivity, DealMetric, DealSettingsValues } from './types.js';
export interface DealStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DealMetric[];
}
export function DealStats(props: DealStatsProps) { return <DomainStats config={config} {...props}/>; }
