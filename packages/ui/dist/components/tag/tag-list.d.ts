import { type DomainFrameProps } from '../../internal/domain.js';
import type { Tag } from './types.js';
export interface TagListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Tag[];
    onSelect?: (item: Tag) => void;
    emptyMessage?: string;
}
export declare function TagList({ onSelect, ...props }: TagListProps): import("react").JSX.Element;
