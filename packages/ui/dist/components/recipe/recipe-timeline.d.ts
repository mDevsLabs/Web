import { type DomainFrameProps } from '../../internal/domain.js';
import type { RecipeActivity } from './types.js';
export interface RecipeTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RecipeActivity[];
    emptyMessage?: string;
}
export declare function RecipeTimeline(props: RecipeTimelineProps): import("react").JSX.Element;
