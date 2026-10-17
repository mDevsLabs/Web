import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRuleMetric } from './types.js';
export interface AlertRuleStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly AlertRuleMetric[];
}
export declare function AlertRuleStats(props: AlertRuleStatsProps): import("react").JSX.Element;
