// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { SleepSession, SleepSessionStatus, SleepSessionActivity, SleepSessionMetric, SleepSessionSettingsValues } from './types.js';
export interface SleepSessionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly SleepSessionMetric[];
}
export function SleepSessionStats(props: SleepSessionStatsProps) { return <DomainStats config={config} {...props}/>; }
