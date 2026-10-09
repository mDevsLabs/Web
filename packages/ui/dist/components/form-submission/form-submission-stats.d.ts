import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmissionMetric } from './types.js';
export interface FormSubmissionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly FormSubmissionMetric[];
}
export declare function FormSubmissionStats(props: FormSubmissionStatsProps): import("react").JSX.Element;
