import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExpenseActivity } from './types.js';
export interface ExpenseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ExpenseActivity[];
    emptyMessage?: string;
}
export declare function ExpenseTimeline(props: ExpenseTimelineProps): import("react").JSX.Element;
