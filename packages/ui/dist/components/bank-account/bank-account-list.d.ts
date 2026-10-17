import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccount } from './types.js';
export interface BankAccountListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BankAccount[];
    onSelect?: (item: BankAccount) => void;
    emptyMessage?: string;
}
export declare function BankAccountList({ onSelect, ...props }: BankAccountListProps): import("react").JSX.Element;
