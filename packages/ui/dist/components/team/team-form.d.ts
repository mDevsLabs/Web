import { type DomainFrameProps } from '../../internal/domain.js';
import type { Team } from './types.js';
export interface TeamFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Team>;
    onSubmit: (value: Omit<Team, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TeamForm({ onSubmit, ...props }: TeamFormProps): import("react").JSX.Element;
