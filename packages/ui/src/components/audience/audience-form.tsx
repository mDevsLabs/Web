// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Audience, AudienceStatus, AudienceActivity, AudienceMetric, AudienceSettingsValues } from './types.js';
export interface AudienceFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Audience>;
    onSubmit: (value: Omit<Audience, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function AudienceForm({ onSubmit, ...props }: AudienceFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Audience, 'id'>)}/>; }
