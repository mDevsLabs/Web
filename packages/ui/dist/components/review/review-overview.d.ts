import { type DomainFrameProps } from '../../internal/domain.js';
import type { Review, ReviewMetric } from './types.js';
export interface ReviewOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Review[];
    metrics: readonly ReviewMetric[];
}
export declare function ReviewOverview(props: ReviewOverviewProps): import("react").JSX.Element;
