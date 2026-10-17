import { type DomainFrameProps } from '../../internal/domain.js';
import type { Tag } from './types.js';
export interface TagCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Tag;
}
export declare function TagCard(props: TagCardProps): import("react").JSX.Element;
