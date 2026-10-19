import { type DomainFrameProps } from '../../internal/domain.js';
import type { BudgetActivity } from './types.js';
export interface BudgetTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BudgetActivity[];
    emptyMessage?: string;
}
export declare function BudgetTimeline(props: BudgetTimelineProps): import("react").JSX.Element;
