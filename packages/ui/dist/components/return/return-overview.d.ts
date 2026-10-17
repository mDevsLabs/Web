import { type DomainFrameProps } from '../../internal/domain.js';
import type { Return, ReturnMetric } from './types.js';
export interface ReturnOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Return[];
    metrics: readonly ReturnMetric[];
}
export declare function ReturnOverview(props: ReturnOverviewProps): import("react").JSX.Element;
