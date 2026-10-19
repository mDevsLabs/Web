import { type DomainFrameProps } from '../../internal/domain.js';
import type { PayrollActivity } from './types.js';
export interface PayrollTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PayrollActivity[];
    emptyMessage?: string;
}
export declare function PayrollTimeline(props: PayrollTimelineProps): import("react").JSX.Element;
