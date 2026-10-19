import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequest } from './types.js';
export interface PullRequestFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<PullRequest>;
    onSubmit: (value: Omit<PullRequest, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function PullRequestForm({ onSubmit, ...props }: PullRequestFormProps): import("react").JSX.Element;
