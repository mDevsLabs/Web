// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Monitor, MonitorStatus, MonitorActivity, MonitorMetric, MonitorSettingsValues } from './types.js';
export interface MonitorFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Monitor>;
    onSubmit: (value: Omit<Monitor, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function MonitorForm({ onSubmit, ...props }: MonitorFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Monitor, 'id'>)}/>; }
