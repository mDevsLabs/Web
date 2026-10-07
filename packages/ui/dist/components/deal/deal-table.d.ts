import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deal } from './types.js';
export interface DealTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Deal[];
    emptyMessage?: string;
}
export declare function DealTable(props: DealTableProps): import("react").JSX.Element;
