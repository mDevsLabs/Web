import { type DomainFrameProps } from '../../internal/domain.js';
import type { Transaction } from './types.js';
export interface TransactionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Transaction[];
    emptyMessage?: string;
}
export declare function TransactionTable(props: TransactionTableProps): import("react").JSX.Element;
