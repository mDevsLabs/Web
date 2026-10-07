import { type DomainFrameProps } from '../../internal/domain.js';
import type { Candidate } from './types.js';
export interface CandidateTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Candidate[];
    emptyMessage?: string;
}
export declare function CandidateTable(props: CandidateTableProps): import("react").JSX.Element;
