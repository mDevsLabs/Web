// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { RouteDefinition, RouteDefinitionStatus, RouteDefinitionActivity, RouteDefinitionMetric, RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<RouteDefinition>;
    onSubmit: (value: Omit<RouteDefinition, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function RouteDefinitionForm({ onSubmit, ...props }: RouteDefinitionFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<RouteDefinition, 'id'>)}/>; }
