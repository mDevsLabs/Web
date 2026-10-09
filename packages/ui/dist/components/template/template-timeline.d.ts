import { type DomainFrameProps } from '../../internal/domain.js';
import type { TemplateActivity } from './types.js';
export interface TemplateTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TemplateActivity[];
    emptyMessage?: string;
}
export declare function TemplateTimeline(props: TemplateTimelineProps): import("react").JSX.Element;
