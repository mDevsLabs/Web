import { type DomainFrameProps } from '../../internal/domain.js';
import type { Board } from './types.js';
export interface BoardListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Board[];
    onSelect?: (item: Board) => void;
    emptyMessage?: string;
}
export declare function BoardList({ onSelect, ...props }: BoardListProps): import("react").JSX.Element;
