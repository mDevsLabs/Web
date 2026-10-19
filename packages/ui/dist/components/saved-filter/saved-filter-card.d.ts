import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilter } from './types.js';
export interface SavedFilterCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: SavedFilter;
}
export declare function SavedFilterCard(props: SavedFilterCardProps): import("react").JSX.Element;
