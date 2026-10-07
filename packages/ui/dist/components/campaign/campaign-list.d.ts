import { type DomainFrameProps } from '../../internal/domain.js';
import type { Campaign } from './types.js';
export interface CampaignListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Campaign[];
    onSelect?: (item: Campaign) => void;
    emptyMessage?: string;
}
export declare function CampaignList({ onSelect, ...props }: CampaignListProps): import("react").JSX.Element;
