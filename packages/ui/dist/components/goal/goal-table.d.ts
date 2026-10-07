import { type DomainFrameProps } from '../../internal/domain.js';
import type { Goal } from './types.js';
export interface GoalTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Goal[];
    emptyMessage?: string;
}
export declare function GoalTable(props: GoalTableProps): import("react").JSX.Element;
