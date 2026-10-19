import { type DomainFrameProps } from '../../internal/domain.js';
import type { Board } from './types.js';
export interface BoardCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Board;
}
export declare function BoardCard(props: BoardCardProps): import("react").JSX.Element;
