import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilter } from './types.js';
export interface SavedFilterListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SavedFilter[];
    onSelect?: (item: SavedFilter) => void;
    emptyMessage?: string;
}
export declare function SavedFilterList({ onSelect, ...props }: SavedFilterListProps): import("react").JSX.Element;
