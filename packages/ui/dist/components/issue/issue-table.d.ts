import { type DomainFrameProps } from '../../internal/domain.js';
import type { Issue } from './types.js';
export interface IssueTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Issue[];
    emptyMessage?: string;
}
export declare function IssueTable(props: IssueTableProps): import("react").JSX.Element;
