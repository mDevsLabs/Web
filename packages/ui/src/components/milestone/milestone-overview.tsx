// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Milestone, MilestoneStatus, MilestoneActivity, MilestoneMetric, MilestoneSettingsValues } from './types.js';
export interface MilestoneOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Milestone[];
    metrics: readonly MilestoneMetric[];
}
export function MilestoneOverview(props: MilestoneOverviewProps) { return <DomainOverview config={config} {...props}/>; }
