import { type DomainFrameProps } from '../../internal/domain.js';
import type { Milestone } from './types.js';
export interface MilestoneTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Milestone[];
    emptyMessage?: string;
}
export declare function MilestoneTable(props: MilestoneTableProps): import("react").JSX.Element;
