import { type DomainFrameProps } from '../../internal/domain.js';
import type { Team } from './types.js';
export interface TeamListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Team[];
    onSelect?: (item: Team) => void;
    emptyMessage?: string;
}
export declare function TeamList({ onSelect, ...props }: TeamListProps): import("react").JSX.Element;
