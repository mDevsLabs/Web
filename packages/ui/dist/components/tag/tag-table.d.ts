import { type DomainFrameProps } from '../../internal/domain.js';
import type { Tag } from './types.js';
export interface TagTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Tag[];
    emptyMessage?: string;
}
export declare function TagTable(props: TagTableProps): import("react").JSX.Element;
