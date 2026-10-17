// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Pipeline, PipelineStatus, PipelineActivity, PipelineMetric, PipelineSettingsValues } from './types.js';
export interface PipelineFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Pipeline>;
    onSubmit: (value: Omit<Pipeline, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function PipelineForm({ onSubmit, ...props }: PipelineFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Pipeline, 'id'>)}/>; }
