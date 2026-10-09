// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Budget, BudgetStatus, BudgetActivity, BudgetMetric, BudgetSettingsValues } from './types.js';
export interface BudgetOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Budget[];
    metrics: readonly BudgetMetric[];
}
export function BudgetOverview(props: BudgetOverviewProps) { return <DomainOverview config={config} {...props}/>; }
