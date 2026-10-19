import { type DomainFrameProps } from '../../internal/domain.js';
import type { CampaignActivity } from './types.js';
export interface CampaignTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CampaignActivity[];
    emptyMessage?: string;
}
export declare function CampaignTimeline(props: CampaignTimelineProps): import("react").JSX.Element;
