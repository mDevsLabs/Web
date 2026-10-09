import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRule } from './types.js';
export interface AlertRuleCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: AlertRule;
}
export declare function AlertRuleCard(props: AlertRuleCardProps): import("react").JSX.Element;
