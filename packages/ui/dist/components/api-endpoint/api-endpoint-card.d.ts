import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpoint } from './types.js';
export interface ApiEndpointCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: ApiEndpoint;
}
export declare function ApiEndpointCard(props: ApiEndpointCardProps): import("react").JSX.Element;
