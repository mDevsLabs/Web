// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Milestone, MilestoneStatus, MilestoneActivity, MilestoneMetric, MilestoneSettingsValues } from './types.js';
export interface MilestoneTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Milestone[];
    emptyMessage?: string;
}
export function MilestoneTable(props: MilestoneTableProps) { return <DomainTable config={config} {...props}/>; }
