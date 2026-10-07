import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommentMetric } from './types.js';
export interface CommentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CommentMetric[];
}
export declare function CommentStats(props: CommentStatsProps): import("react").JSX.Element;
