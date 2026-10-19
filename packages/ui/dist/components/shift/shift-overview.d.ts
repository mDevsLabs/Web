import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shift, ShiftMetric } from './types.js';
export interface ShiftOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shift[];
    metrics: readonly ShiftMetric[];
}
export declare function ShiftOverview(props: ShiftOverviewProps): import("react").JSX.Element;
