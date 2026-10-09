// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AlertRule, AlertRuleStatus, AlertRuleActivity, AlertRuleMetric, AlertRuleSettingsValues } from './types.js';
export interface AlertRuleEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function AlertRuleEmptyState(props: AlertRuleEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
