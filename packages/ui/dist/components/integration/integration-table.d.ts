import { type DomainFrameProps } from '../../internal/domain.js';
import type { Integration } from './types.js';
export interface IntegrationTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Integration[];
    emptyMessage?: string;
}
export declare function IntegrationTable(props: IntegrationTableProps): import("react").JSX.Element;
