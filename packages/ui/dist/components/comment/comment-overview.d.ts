import { type DomainFrameProps } from '../../internal/domain.js';
import type { Comment, CommentMetric } from './types.js';
export interface CommentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Comment[];
    metrics: readonly CommentMetric[];
}
export declare function CommentOverview(props: CommentOverviewProps): import("react").JSX.Element;
