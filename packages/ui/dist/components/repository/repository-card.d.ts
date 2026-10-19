import { type DomainFrameProps } from '../../internal/domain.js';
import type { Repository } from './types.js';
export interface RepositoryCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Repository;
}
export declare function RepositoryCard(props: RepositoryCardProps): import("react").JSX.Element;
