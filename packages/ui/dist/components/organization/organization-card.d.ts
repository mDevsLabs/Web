import { type DomainFrameProps } from '../../internal/domain.js';
import type { Organization } from './types.js';
export interface OrganizationCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Organization;
}
export declare function OrganizationCard(props: OrganizationCardProps): import("react").JSX.Element;
