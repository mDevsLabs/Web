// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Milestone, MilestoneStatus, MilestoneActivity, MilestoneMetric, MilestoneSettingsValues } from './types.js';
export interface MilestoneFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Milestone>;
    onSubmit: (value: Omit<Milestone, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function MilestoneForm({ onSubmit, ...props }: MilestoneFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Milestone, 'id'>)}/>; }
