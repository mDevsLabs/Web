// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Prescription, PrescriptionStatus, PrescriptionActivity, PrescriptionMetric, PrescriptionSettingsValues } from './types.js';
export interface PrescriptionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Prescription[];
    onSelect?: (item: Prescription) => void;
    emptyMessage?: string;
}
export function PrescriptionList({ onSelect, ...props }: PrescriptionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Prescription) : undefined}/>; }
