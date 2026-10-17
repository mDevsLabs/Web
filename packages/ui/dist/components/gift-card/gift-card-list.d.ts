import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCard } from './types.js';
export interface GiftCardListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly GiftCard[];
    onSelect?: (item: GiftCard) => void;
    emptyMessage?: string;
}
export declare function GiftCardList({ onSelect, ...props }: GiftCardListProps): import("react").JSX.Element;
