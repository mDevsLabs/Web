// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TaxReport, TaxReportStatus, TaxReportActivity, TaxReportMetric, TaxReportSettingsValues } from './types.js';
export interface TaxReportFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<TaxReport>;
    onSubmit: (value: Omit<TaxReport, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function TaxReportForm({ onSubmit, ...props }: TaxReportFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<TaxReport, 'id'>)}/>; }
