// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Expense, ExpenseStatus, ExpenseActivity, ExpenseMetric, ExpenseSettingsValues } from './types.js';
export interface ExpenseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ExpenseActivity[];
    emptyMessage?: string;
}
export function ExpenseTimeline(props: ExpenseTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
