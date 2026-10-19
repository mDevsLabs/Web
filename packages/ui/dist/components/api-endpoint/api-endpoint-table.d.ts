import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpoint } from './types.js';
export interface ApiEndpointTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly ApiEndpoint[];
    emptyMessage?: string;
}
export declare function ApiEndpointTable(props: ApiEndpointTableProps): import("react").JSX.Element;
