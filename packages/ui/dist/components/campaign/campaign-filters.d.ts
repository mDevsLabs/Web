import { type DomainFrameProps } from '../../internal/domain.js';
import type { CampaignStatus } from './types.js';
export interface CampaignFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CampaignStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CampaignStatus | '') => void;
}
export declare function CampaignFilters({ onStatusChange, ...props }: CampaignFiltersProps): import("react").JSX.Element;
