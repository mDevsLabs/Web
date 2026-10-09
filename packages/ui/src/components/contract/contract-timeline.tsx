// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Contract, ContractStatus, ContractActivity, ContractMetric, ContractSettingsValues } from './types.js';
export interface ContractTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ContractActivity[];
    emptyMessage?: string;
}
export function ContractTimeline(props: ContractTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
