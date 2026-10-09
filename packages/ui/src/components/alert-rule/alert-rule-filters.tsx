// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AlertRule, AlertRuleStatus, AlertRuleActivity, AlertRuleMetric, AlertRuleSettingsValues } from './types.js';
export interface AlertRuleFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AlertRuleStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AlertRuleStatus | '') => void;
}
export function AlertRuleFilters({ onStatusChange, ...props }: AlertRuleFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as AlertRuleStatus | '') : undefined}/>; }
