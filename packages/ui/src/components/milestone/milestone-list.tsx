// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Milestone, MilestoneStatus, MilestoneActivity, MilestoneMetric, MilestoneSettingsValues } from './types.js';
export interface MilestoneListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Milestone[];
    onSelect?: (item: Milestone) => void;
    emptyMessage?: string;
}
export function MilestoneList({ onSelect, ...props }: MilestoneListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Milestone) : undefined}/>; }
