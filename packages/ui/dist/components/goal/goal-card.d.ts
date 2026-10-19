import { type DomainFrameProps } from '../../internal/domain.js';
import type { Goal } from './types.js';
export interface GoalCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Goal;
}
export declare function GoalCard(props: GoalCardProps): import("react").JSX.Element;
