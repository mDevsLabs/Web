// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Goal, GoalStatus, GoalActivity, GoalMetric, GoalSettingsValues } from './types.js';
export interface GoalCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Goal;
}
export function GoalCard(props: GoalCardProps) { return <DomainCard config={config} {...props}/>; }
