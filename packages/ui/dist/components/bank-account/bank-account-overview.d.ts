import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccount, BankAccountMetric } from './types.js';
export interface BankAccountOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BankAccount[];
    metrics: readonly BankAccountMetric[];
}
export declare function BankAccountOverview(props: BankAccountOverviewProps): import("react").JSX.Element;
