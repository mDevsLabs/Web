import { type DomainFrameProps } from '../../internal/domain.js';
import type { RepositoryActivity } from './types.js';
export interface RepositoryTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RepositoryActivity[];
    emptyMessage?: string;
}
export declare function RepositoryTimeline(props: RepositoryTimelineProps): import("react").JSX.Element;
