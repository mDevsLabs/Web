// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Prescription, PrescriptionStatus, PrescriptionActivity, PrescriptionMetric, PrescriptionSettingsValues } from './types.js';
export interface PrescriptionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PrescriptionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PrescriptionStatus | '') => void;
}
export function PrescriptionFilters({ onStatusChange, ...props }: PrescriptionFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as PrescriptionStatus | '') : undefined}/>; }
