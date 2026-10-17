import { type DomainFrameProps } from '../../internal/domain.js';
import type { Cart } from './types.js';
export interface CartListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Cart[];
    onSelect?: (item: Cart) => void;
    emptyMessage?: string;
}
export declare function CartList({ onSelect, ...props }: CartListProps): import("react").JSX.Element;
