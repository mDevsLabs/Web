import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmissionActivity } from './types.js';
export interface FormSubmissionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly FormSubmissionActivity[];
    emptyMessage?: string;
}
export declare function FormSubmissionTimeline(props: FormSubmissionTimelineProps): import("react").JSX.Element;
