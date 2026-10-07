// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shift, ShiftStatus, ShiftActivity, ShiftMetric, ShiftSettingsValues } from './types.js';
export interface ShiftOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shift[];
    metrics: readonly ShiftMetric[];
}
export function ShiftOverview(props: ShiftOverviewProps) { return <DomainOverview config={config} {...props}/>; }
