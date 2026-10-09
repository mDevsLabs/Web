import { type DomainFrameProps } from '../../internal/domain.js';
import type { NutritionActivity } from './types.js';
export interface NutritionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly NutritionActivity[];
    emptyMessage?: string;
}
export declare function NutritionTimeline(props: NutritionTimelineProps): import("react").JSX.Element;
