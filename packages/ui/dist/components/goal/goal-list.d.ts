import { type DomainFrameProps } from '../../internal/domain.js';
import type { Goal } from './types.js';
export interface GoalListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Goal[];
    onSelect?: (item: Goal) => void;
    emptyMessage?: string;
}
export declare function GoalList({ onSelect, ...props }: GoalListProps): import("react").JSX.Element;
