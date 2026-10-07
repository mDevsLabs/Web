import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRule, AlertRuleMetric } from './types.js';
export interface AlertRuleOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AlertRule[];
    metrics: readonly AlertRuleMetric[];
}
export declare function AlertRuleOverview(props: AlertRuleOverviewProps): import("react").JSX.Element;
