import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReviewSettingsValues } from './types.js';
export interface ReviewSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReviewSettingsValues;
    onChange: (key: keyof ReviewSettingsValues, value: boolean) => void;
}
export declare function ReviewSettings({ onChange, ...props }: ReviewSettingsProps): import("react").JSX.Element;
