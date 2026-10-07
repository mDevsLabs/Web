import { type DomainFrameProps } from '../../internal/domain.js';
import type { TransactionMetric } from './types.js';
export interface TransactionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TransactionMetric[];
}
export declare function TransactionStats(props: TransactionStatsProps): import("react").JSX.Element;
