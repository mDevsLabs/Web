import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccountMetric } from './types.js';
export interface BankAccountStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BankAccountMetric[];
}
export declare function BankAccountStats(props: BankAccountStatsProps): import("react").JSX.Element;
