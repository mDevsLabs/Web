import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilter } from './types.js';
export interface SavedFilterTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SavedFilter[];
    emptyMessage?: string;
}
export declare function SavedFilterTable(props: SavedFilterTableProps): import("react").JSX.Element;
