// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Milestone, MilestoneStatus, MilestoneActivity, MilestoneMetric, MilestoneSettingsValues } from './types.js';
export interface MilestoneCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Milestone;
}
export function MilestoneCard(props: MilestoneCardProps) { return <DomainCard config={config} {...props}/>; }
