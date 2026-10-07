import { type DomainFrameProps } from '../../internal/domain.js';
import type { Issue } from './types.js';
export interface IssueCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Issue;
}
export declare function IssueCard(props: IssueCardProps): import("react").JSX.Element;
