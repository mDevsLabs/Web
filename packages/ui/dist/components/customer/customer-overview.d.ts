import { type DomainFrameProps } from '../../internal/domain.js';
import type { Customer, CustomerMetric } from './types.js';
export interface CustomerOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Customer[];
    metrics: readonly CustomerMetric[];
}
export declare function CustomerOverview(props: CustomerOverviewProps): import("react").JSX.Element;
