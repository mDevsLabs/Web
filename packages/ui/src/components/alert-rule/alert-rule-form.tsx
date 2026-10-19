// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AlertRule, AlertRuleStatus, AlertRuleActivity, AlertRuleMetric, AlertRuleSettingsValues } from './types.js';
export interface AlertRuleFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<AlertRule>;
    onSubmit: (value: Omit<AlertRule, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function AlertRuleForm({ onSubmit, ...props }: AlertRuleFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<AlertRule, 'id'>)}/>; }
