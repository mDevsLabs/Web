// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { HotelRoom, HotelRoomStatus, HotelRoomActivity, HotelRoomMetric, HotelRoomSettingsValues } from './types.js';
export interface HotelRoomFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<HotelRoom>;
    onSubmit: (value: Omit<HotelRoom, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function HotelRoomForm({ onSubmit, ...props }: HotelRoomFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<HotelRoom, 'id'>)}/>; }
