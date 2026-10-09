import { type DomainFrameProps } from '../../internal/domain.js';
import type { Folder, FolderMetric } from './types.js';
export interface FolderOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Folder[];
    metrics: readonly FolderMetric[];
}
export declare function FolderOverview(props: FolderOverviewProps): import("react").JSX.Element;
