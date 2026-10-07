// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Goal, GoalStatus, GoalActivity, GoalMetric, GoalSettingsValues } from './types.js';
export interface GoalListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Goal[];
    onSelect?: (item: Goal) => void;
    emptyMessage?: string;
}
export function GoalList({ onSelect, ...props }: GoalListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Goal) : undefined}/>; }
