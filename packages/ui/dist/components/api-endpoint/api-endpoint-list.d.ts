import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpoint } from './types.js';
export interface ApiEndpointListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly ApiEndpoint[];
    onSelect?: (item: ApiEndpoint) => void;
    emptyMessage?: string;
}
export declare function ApiEndpointList({ onSelect, ...props }: ApiEndpointListProps): import("react").JSX.Element;
