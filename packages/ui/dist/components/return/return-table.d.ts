import { type DomainFrameProps } from '../../internal/domain.js';
import type { Return } from './types.js';
export interface ReturnTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Return[];
    emptyMessage?: string;
}
export declare function ReturnTable(props: ReturnTableProps): import("react").JSX.Element;
