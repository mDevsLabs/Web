import { type DomainFrameProps } from '../../internal/domain.js';
import type { Audience } from './types.js';
export interface AudienceFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Audience>;
    onSubmit: (value: Omit<Audience, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function AudienceForm({ onSubmit, ...props }: AudienceFormProps): import("react").JSX.Element;
