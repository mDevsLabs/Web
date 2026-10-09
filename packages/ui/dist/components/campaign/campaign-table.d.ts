import { type DomainFrameProps } from '../../internal/domain.js';
import type { Campaign } from './types.js';
export interface CampaignTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Campaign[];
    emptyMessage?: string;
}
export declare function CampaignTable(props: CampaignTableProps): import("react").JSX.Element;
