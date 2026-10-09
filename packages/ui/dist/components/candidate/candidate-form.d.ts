import { type DomainFrameProps } from '../../internal/domain.js';
import type { Candidate } from './types.js';
export interface CandidateFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Candidate>;
    onSubmit: (value: Omit<Candidate, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CandidateForm({ onSubmit, ...props }: CandidateFormProps): import("react").JSX.Element;
