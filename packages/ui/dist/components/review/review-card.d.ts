import { type DomainFrameProps } from '../../internal/domain.js';
import type { Review } from './types.js';
export interface ReviewCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Review;
}
export declare function ReviewCard(props: ReviewCardProps): import("react").JSX.Element;
