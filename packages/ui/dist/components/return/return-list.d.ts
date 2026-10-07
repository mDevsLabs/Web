import { type DomainFrameProps } from '../../internal/domain.js';
import type { Return } from './types.js';
export interface ReturnListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Return[];
    onSelect?: (item: Return) => void;
    emptyMessage?: string;
}
export declare function ReturnList({ onSelect, ...props }: ReturnListProps): import("react").JSX.Element;
