import { type DomainFrameProps } from '../../internal/domain.js';
import type { BoardSettingsValues } from './types.js';
export interface BoardSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BoardSettingsValues;
    onChange: (key: keyof BoardSettingsValues, value: boolean) => void;
}
export declare function BoardSettings({ onChange, ...props }: BoardSettingsProps): import("react").JSX.Element;
