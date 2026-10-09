import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccount } from './types.js';
export interface BankAccountCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: BankAccount;
}
export declare function BankAccountCard(props: BankAccountCardProps): import("react").JSX.Element;
