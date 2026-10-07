import { type DomainFrameProps } from '../../internal/domain.js';
import type { Board } from './types.js';
export interface BoardTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Board[];
    emptyMessage?: string;
}
export declare function BoardTable(props: BoardTableProps): import("react").JSX.Element;
