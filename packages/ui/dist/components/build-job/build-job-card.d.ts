import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJob } from './types.js';
export interface BuildJobCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: BuildJob;
}
export declare function BuildJobCard(props: BuildJobCardProps): import("react").JSX.Element;
