import { type DomainFrameProps } from '../../internal/domain.js';
import type { Sprint } from './types.js';
export interface SprintListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Sprint[];
    onSelect?: (item: Sprint) => void;
    emptyMessage?: string;
}
export declare function SprintList({ onSelect, ...props }: SprintListProps): import("react").JSX.Element;
