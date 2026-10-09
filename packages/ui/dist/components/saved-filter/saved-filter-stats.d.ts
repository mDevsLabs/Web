import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilterMetric } from './types.js';
export interface SavedFilterStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly SavedFilterMetric[];
}
export declare function SavedFilterStats(props: SavedFilterStatsProps): import("react").JSX.Element;
