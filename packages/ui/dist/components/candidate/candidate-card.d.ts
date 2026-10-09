import { type DomainFrameProps } from '../../internal/domain.js';
import type { Candidate } from './types.js';
export interface CandidateCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Candidate;
}
export declare function CandidateCard(props: CandidateCardProps): import("react").JSX.Element;
