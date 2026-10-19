import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccount } from './types.js';
export interface BankAccountTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BankAccount[];
    emptyMessage?: string;
}
export declare function BankAccountTable(props: BankAccountTableProps): import("react").JSX.Element;
