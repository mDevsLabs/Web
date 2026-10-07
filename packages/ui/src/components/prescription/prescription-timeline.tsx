// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Prescription, PrescriptionStatus, PrescriptionActivity, PrescriptionMetric, PrescriptionSettingsValues } from './types.js';
export interface PrescriptionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PrescriptionActivity[];
    emptyMessage?: string;
}
export function PrescriptionTimeline(props: PrescriptionTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
