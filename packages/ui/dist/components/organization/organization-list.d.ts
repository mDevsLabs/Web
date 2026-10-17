import { type DomainFrameProps } from '../../internal/domain.js';
import type { Organization } from './types.js';
export interface OrganizationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Organization[];
    onSelect?: (item: Organization) => void;
    emptyMessage?: string;
}
export declare function OrganizationList({ onSelect, ...props }: OrganizationListProps): import("react").JSX.Element;
