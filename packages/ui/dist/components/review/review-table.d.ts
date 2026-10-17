import { type DomainFrameProps } from '../../internal/domain.js';
import type { Review } from './types.js';
export interface ReviewTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Review[];
    emptyMessage?: string;
}
export declare function ReviewTable(props: ReviewTableProps): import("react").JSX.Element;
