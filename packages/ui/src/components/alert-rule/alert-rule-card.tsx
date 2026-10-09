// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { AlertRule, AlertRuleStatus, AlertRuleActivity, AlertRuleMetric, AlertRuleSettingsValues } from './types.js';
export interface AlertRuleCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: AlertRule;
}
export function AlertRuleCard(props: AlertRuleCardProps) { return <DomainCard config={config} {...props}/>; }
