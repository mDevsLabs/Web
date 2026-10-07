import { type DomainFrameProps } from '../../internal/domain.js';
import type { DocumentActivity } from './types.js';
export interface DocumentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly DocumentActivity[];
    emptyMessage?: string;
}
export declare function DocumentTimeline(props: DocumentTimelineProps): import("react").JSX.Element;
