import { type DomainFrameProps } from '../../internal/domain.js';
import type { Cart } from './types.js';
export interface CartTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Cart[];
    emptyMessage?: string;
}
export declare function CartTable(props: CartTableProps): import("react").JSX.Element;
