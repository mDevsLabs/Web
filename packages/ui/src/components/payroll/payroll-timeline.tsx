// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payroll, PayrollStatus, PayrollActivity, PayrollMetric, PayrollSettingsValues } from './types.js';
export interface PayrollTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PayrollActivity[];
    emptyMessage?: string;
}
export function PayrollTimeline(props: PayrollTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
