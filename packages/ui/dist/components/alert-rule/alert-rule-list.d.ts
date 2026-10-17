import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRule } from './types.js';
export interface AlertRuleListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AlertRule[];
    onSelect?: (item: AlertRule) => void;
    emptyMessage?: string;
}
export declare function AlertRuleList({ onSelect, ...props }: AlertRuleListProps): import("react").JSX.Element;
