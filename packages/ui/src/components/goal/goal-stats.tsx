// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Goal, GoalStatus, GoalActivity, GoalMetric, GoalSettingsValues } from './types.js';
export interface GoalStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly GoalMetric[];
}
export function GoalStats(props: GoalStatsProps) { return <DomainStats config={config} {...props}/>; }
