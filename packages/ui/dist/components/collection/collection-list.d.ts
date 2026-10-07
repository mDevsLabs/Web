import { type DomainFrameProps } from '../../internal/domain.js';
import type { Collection } from './types.js';
export interface CollectionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Collection[];
    onSelect?: (item: Collection) => void;
    emptyMessage?: string;
}
export declare function CollectionList({ onSelect, ...props }: CollectionListProps): import("react").JSX.Element;
