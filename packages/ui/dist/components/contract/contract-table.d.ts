import { type DomainFrameProps } from '../../internal/domain.js';
import type { Contract } from './types.js';
export interface ContractTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Contract[];
    emptyMessage?: string;
}
export declare function ContractTable(props: ContractTableProps): import("react").JSX.Element;
