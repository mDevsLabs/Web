import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpoint } from './types.js';
export interface ApiEndpointFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<ApiEndpoint>;
    onSubmit: (value: Omit<ApiEndpoint, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ApiEndpointForm({ onSubmit, ...props }: ApiEndpointFormProps): import("react").JSX.Element;
