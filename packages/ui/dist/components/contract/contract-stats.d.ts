import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContractMetric } from './types.js';
export interface ContractStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ContractMetric[];
}
export declare function ContractStats(props: ContractStatsProps): import("react").JSX.Element;
