import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucketSettingsValues } from './types.js';
export interface StorageBucketSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: StorageBucketSettingsValues;
    onChange: (key: keyof StorageBucketSettingsValues, value: boolean) => void;
}
export declare function StorageBucketSettings({ onChange, ...props }: StorageBucketSettingsProps): import("react").JSX.Element;
