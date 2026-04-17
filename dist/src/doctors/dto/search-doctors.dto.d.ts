export declare enum SortDoctorsBy {
    RATING = "rating",
    EXPERIENCE = "experience",
    NEWEST = "newest"
}
export declare class SearchDoctorsDto {
    searchTerm?: string;
    specialtyId?: string;
    sortBy?: SortDoctorsBy;
    page?: number;
    limit?: number;
}
