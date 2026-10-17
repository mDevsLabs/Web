import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMemberStatus } from './types.js';
export interface CommunityMemberFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CommunityMemberStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CommunityMemberStatus | '') => void;
}
export declare function CommunityMemberFilters({ onStatusChange, ...props }: CommunityMemberFiltersProps): import("react").JSX.Element;
