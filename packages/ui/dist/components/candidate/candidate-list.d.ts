import { type DomainFrameProps } from '../../internal/domain.js';
import type { Candidate } from './types.js';
export interface CandidateListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Candidate[];
    onSelect?: (item: Candidate) => void;
    emptyMessage?: string;
}
export declare function CandidateList({ onSelect, ...props }: CandidateListProps): import("react").JSX.Element;
