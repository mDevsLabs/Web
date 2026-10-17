import { type DomainFrameProps } from '../../internal/domain.js';
import type { Transaction } from './types.js';
export interface TransactionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Transaction[];
    onSelect?: (item: Transaction) => void;
    emptyMessage?: string;
}
export declare function TransactionList({ onSelect, ...props }: TransactionListProps): import("react").JSX.Element;
