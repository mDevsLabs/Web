import { type DomainFrameProps } from '../../internal/domain.js';
import type { Milestone } from './types.js';
export interface MilestoneListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Milestone[];
    onSelect?: (item: Milestone) => void;
    emptyMessage?: string;
}
export declare function MilestoneList({ onSelect, ...props }: MilestoneListProps): import("react").JSX.Element;
