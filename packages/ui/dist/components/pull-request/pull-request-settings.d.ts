import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequestSettingsValues } from './types.js';
export interface PullRequestSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PullRequestSettingsValues;
    onChange: (key: keyof PullRequestSettingsValues, value: boolean) => void;
}
export declare function PullRequestSettings({ onChange, ...props }: PullRequestSettingsProps): import("react").JSX.Element;
