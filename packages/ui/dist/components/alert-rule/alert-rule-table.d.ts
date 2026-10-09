import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRule } from './types.js';
export interface AlertRuleTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly AlertRule[];
    emptyMessage?: string;
}
export declare function AlertRuleTable(props: AlertRuleTableProps): import("react").JSX.Element;
