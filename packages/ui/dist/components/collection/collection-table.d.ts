import { type DomainFrameProps } from '../../internal/domain.js';
import type { Collection } from './types.js';
export interface CollectionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Collection[];
    emptyMessage?: string;
}
export declare function CollectionTable(props: CollectionTableProps): import("react").JSX.Element;
