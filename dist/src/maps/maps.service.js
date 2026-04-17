"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let MapsService = class MapsService {
    reverseGeocodeUrl = 'https://nominatim.openstreetmap.org/reverse';
    async reverseGeocode(latitude, longitude) {
        try {
            const response = await axios_1.default.get(this.reverseGeocodeUrl, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    format: 'jsonv2',
                    'accept-language': 'en',
                    addressdetails: 1,
                },
                headers: {
                    'User-Agent': 'care-project/1.0 (contact: support@care-project.local)',
                },
                timeout: 10000,
            });
            const data = response.data;
            if (!data?.display_name) {
                throw new common_1.BadRequestException('Unable to resolve address from location');
            }
            const address = data.address ?? {};
            return {
                formattedAddress: data.display_name,
                placeId: data.place_id ? String(data.place_id) : undefined,
                street: this.buildStreet(address),
                area: address.suburb || address.neighbourhood,
                city: address.city || address.town || address.village,
                state: address.state,
                country: address.country,
                postalCode: address.postcode,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            if (axios_1.default.isAxiosError(error)) {
                throw new common_1.InternalServerErrorException(`OpenStreetMap reverse geocoding failed: ${error.message}`);
            }
            throw new common_1.InternalServerErrorException('Failed to communicate with map service');
        }
    }
    buildStreet(address) {
        if (address.house_number && address.road) {
            return `${address.house_number} ${address.road}`;
        }
        return address.road;
    }
};
exports.MapsService = MapsService;
exports.MapsService = MapsService = __decorate([
    (0, common_1.Injectable)()
], MapsService);
//# sourceMappingURL=maps.service.js.map