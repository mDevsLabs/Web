import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRuleActivity } from './types.js';
export interface AlertRuleTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly AlertRuleActivity[];
    emptyMessage?: string;
}
export declare function AlertRuleTimeline(props: AlertRuleTimelineProps): import("react").JSX.Element;
