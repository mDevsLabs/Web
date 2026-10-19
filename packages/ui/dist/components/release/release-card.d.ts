import { type DomainFrameProps } from '../../internal/domain.js';
import type { Release } from './types.js';
export interface ReleaseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Release;
}
export declare function ReleaseCard(props: ReleaseCardProps): import("react").JSX.Element;
