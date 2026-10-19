import { type DomainFrameProps } from '../../internal/domain.js';
import type { TransactionActivity } from './types.js';
export interface TransactionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TransactionActivity[];
    emptyMessage?: string;
}
export declare function TransactionTimeline(props: TransactionTimelineProps): import("react").JSX.Element;
