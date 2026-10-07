import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contract, ContractMetric } from './types.js';
export interface ContractOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contract[];
    metrics: readonly ContractMetric[];
}
export declare function ContractOverview(props: ContractOverviewProps): import("react").JSX.Element;
