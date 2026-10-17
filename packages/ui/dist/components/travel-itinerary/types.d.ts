import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type TravelItinerary = {
    id?: string;
    title: string;
    traveler: string;
    startsOn: string;
    dayCount: number;
    status: "draft" | "confirmed" | "completed";
};
export type TravelItineraryStatus = TravelItinerary['status'];
export interface TravelItineraryActivity extends DomainActivity {
    travelitineraryId?: string;
}
export type TravelItineraryMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalTravelItinerary' | 'activeTravelItinerary' | 'valueTravelItinerary';
};
export type TravelItinerarySettingsValues = Partial<Record<"notifyTravelItinerary" | "archiveTravelItinerary" | "approveTravelItinerary", boolean>>;
