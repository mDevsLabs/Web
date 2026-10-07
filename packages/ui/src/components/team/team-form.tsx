// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Team, TeamStatus, TeamActivity, TeamMetric, TeamSettingsValues } from './types.js';
export interface TeamFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Team>;
    onSubmit: (value: Omit<Team, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function TeamForm({ onSubmit, ...props }: TeamFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Team, 'id'>)}/>; }
