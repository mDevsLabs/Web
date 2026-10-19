import { type DomainFrameProps } from '../../internal/domain.js';
import type { Transaction } from './types.js';
export interface TransactionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Transaction;
}
export declare function TransactionCard(props: TransactionCardProps): import("react").JSX.Element;
