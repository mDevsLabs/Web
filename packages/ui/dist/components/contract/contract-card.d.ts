import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contract } from './types.js';
export interface ContractCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Contract;
}
export declare function ContractCard(props: ContractCardProps): import("react").JSX.Element;
