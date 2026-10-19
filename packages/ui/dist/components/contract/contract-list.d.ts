import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contract } from './types.js';
export interface ContractListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contract[];
    onSelect?: (item: Contract) => void;
    emptyMessage?: string;
}
export declare function ContractList({ onSelect, ...props }: ContractListProps): import("react").JSX.Element;
