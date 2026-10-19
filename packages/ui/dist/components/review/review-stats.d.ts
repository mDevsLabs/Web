import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReviewMetric } from './types.js';
export interface ReviewStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ReviewMetric[];
}
export declare function ReviewStats(props: ReviewStatsProps): import("react").JSX.Element;
