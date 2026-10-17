import { type DomainFrameProps } from '../../internal/domain.js';
import type { Organization } from './types.js';
export interface OrganizationTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Organization[];
    emptyMessage?: string;
}
export declare function OrganizationTable(props: OrganizationTableProps): import("react").JSX.Element;
