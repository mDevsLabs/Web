// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Goal, GoalStatus, GoalActivity, GoalMetric, GoalSettingsValues } from './types.js';
export interface GoalTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Goal[];
    emptyMessage?: string;
}
export function GoalTable(props: GoalTableProps) { return <DomainTable config={config} {...props}/>; }
