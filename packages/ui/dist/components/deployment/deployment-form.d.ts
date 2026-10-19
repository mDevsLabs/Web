import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deployment } from './types.js';
export interface DeploymentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Deployment>;
    onSubmit: (value: Omit<Deployment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function DeploymentForm({ onSubmit, ...props }: DeploymentFormProps): import("react").JSX.Element;
