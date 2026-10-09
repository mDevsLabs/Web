import { type DomainFrameProps } from '../../internal/domain.js';
import type { Milestone } from './types.js';
export interface MilestoneCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Milestone;
}
export declare function MilestoneCard(props: MilestoneCardProps): import("react").JSX.Element;
