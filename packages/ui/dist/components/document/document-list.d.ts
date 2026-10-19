import { type DomainFrameProps } from '../../internal/domain.js';
import type { Document } from './types.js';
export interface DocumentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Document[];
    onSelect?: (item: Document) => void;
    emptyMessage?: string;
}
export declare function DocumentList({ onSelect, ...props }: DocumentListProps): import("react").JSX.Element;
