// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { TaxReport, TaxReportStatus, TaxReportActivity, TaxReportMetric, TaxReportSettingsValues } from './types.js';
export interface TaxReportSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TaxReportSettingsValues;
    onChange: (key: keyof TaxReportSettingsValues, value: boolean) => void;
}
export function TaxReportSettings({ onChange, ...props }: TaxReportSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TaxReportSettingsValues, value)}/>; }
