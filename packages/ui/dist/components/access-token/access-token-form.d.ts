import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessToken } from './types.js';
export interface AccessTokenFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<AccessToken>;
    onSubmit: (value: Omit<AccessToken, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function AccessTokenForm({ onSubmit, ...props }: AccessTokenFormProps): import("react").JSX.Element;
