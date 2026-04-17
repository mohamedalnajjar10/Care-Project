export interface ResolvedMapAddress {
    formattedAddress: string;
    placeId?: string;
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}
export declare class MapsService {
    private readonly reverseGeocodeUrl;
    reverseGeocode(latitude: number, longitude: number): Promise<ResolvedMapAddress>;
    private buildStreet;
}
