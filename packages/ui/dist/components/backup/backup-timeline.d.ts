import { type DomainFrameProps } from '../../internal/domain.js';
import type { BackupActivity } from './types.js';
export interface BackupTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BackupActivity[];
    emptyMessage?: string;
}
export declare function BackupTimeline(props: BackupTimelineProps): import("react").JSX.Element;
