import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccountActivity } from './types.js';
export interface BankAccountTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BankAccountActivity[];
    emptyMessage?: string;
}
export declare function BankAccountTimeline(props: BankAccountTimelineProps): import("react").JSX.Element;
