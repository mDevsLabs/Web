import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deal, DealMetric } from './types.js';
export interface DealOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deal[];
    metrics: readonly DealMetric[];
}
export declare function DealOverview(props: DealOverviewProps): import("react").JSX.Element;
