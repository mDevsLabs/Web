// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AlertRule, AlertRuleStatus, AlertRuleActivity, AlertRuleMetric, AlertRuleSettingsValues } from './types.js';
export interface AlertRuleListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AlertRule[];
    onSelect?: (item: AlertRule) => void;
    emptyMessage?: string;
}
export function AlertRuleList({ onSelect, ...props }: AlertRuleListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as AlertRule) : undefined}/>; }
