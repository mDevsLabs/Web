import { type DomainFrameProps } from '../../internal/domain.js';
import type { Sprint } from './types.js';
export interface SprintCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Sprint;
}
export declare function SprintCard(props: SprintCardProps): import("react").JSX.Element;
