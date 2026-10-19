import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilter, SavedFilterMetric } from './types.js';
export interface SavedFilterOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SavedFilter[];
    metrics: readonly SavedFilterMetric[];
}
export declare function SavedFilterOverview(props: SavedFilterOverviewProps): import("react").JSX.Element;
