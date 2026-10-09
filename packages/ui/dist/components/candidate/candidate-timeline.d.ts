import { type DomainFrameProps } from '../../internal/domain.js';
import type { CandidateActivity } from './types.js';
export interface CandidateTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CandidateActivity[];
    emptyMessage?: string;
}
export declare function CandidateTimeline(props: CandidateTimelineProps): import("react").JSX.Element;
