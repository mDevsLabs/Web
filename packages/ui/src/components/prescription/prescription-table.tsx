// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Prescription, PrescriptionStatus, PrescriptionActivity, PrescriptionMetric, PrescriptionSettingsValues } from './types.js';
export interface PrescriptionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Prescription[];
    emptyMessage?: string;
}
export function PrescriptionTable(props: PrescriptionTableProps) { return <DomainTable config={config} {...props}/>; }
