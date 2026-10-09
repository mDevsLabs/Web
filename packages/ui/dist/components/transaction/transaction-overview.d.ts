import { type DomainFrameProps } from '../../internal/domain.js';
import type { Transaction, TransactionMetric } from './types.js';
export interface TransactionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Transaction[];
    metrics: readonly TransactionMetric[];
}
export declare function TransactionOverview(props: TransactionOverviewProps): import("react").JSX.Element;
