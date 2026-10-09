import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinition } from './types.js';
export interface RouteDefinitionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<RouteDefinition>;
    onSubmit: (value: Omit<RouteDefinition, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function RouteDefinitionForm({ onSubmit, ...props }: RouteDefinitionFormProps): import("react").JSX.Element;
