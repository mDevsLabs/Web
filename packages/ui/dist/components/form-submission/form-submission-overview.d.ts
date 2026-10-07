import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmission, FormSubmissionMetric } from './types.js';
export interface FormSubmissionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FormSubmission[];
    metrics: readonly FormSubmissionMetric[];
}
export declare function FormSubmissionOverview(props: FormSubmissionOverviewProps): import("react").JSX.Element;
