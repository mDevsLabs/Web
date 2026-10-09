import { type DomainFrameProps } from '../../internal/domain.js';
import type { Campaign } from './types.js';
export interface CampaignCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Campaign;
}
export declare function CampaignCard(props: CampaignCardProps): import("react").JSX.Element;
