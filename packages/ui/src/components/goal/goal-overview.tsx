// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Goal, GoalStatus, GoalActivity, GoalMetric, GoalSettingsValues } from './types.js';
export interface GoalOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Goal[];
    metrics: readonly GoalMetric[];
}
export function GoalOverview(props: GoalOverviewProps) { return <DomainOverview config={config} {...props}/>; }
