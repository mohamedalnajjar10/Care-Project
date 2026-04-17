"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareSearchMapper = void 0;
class CareSearchMapper {
    static doctorToDocument(d) {
        return {
            id: `doctor_${d.id}`,
            type: 'doctor',
            doctorProfileId: d.id,
            userId: d.userId,
            specialtyId: d.specialtyId,
            title: d.user.fullName,
            subtitle: `${d.specialty.name} - ${d.hospitalName}`,
            tags: [d.specialty.name, d.hospitalName],
            rating: Number(d.rating ?? 0),
            experience: Number(d.experience ?? 0),
            createdAt: d.createdAt.getTime(),
        };
    }
    static specialtyToDocument(s) {
        return {
            id: `specialty_${s.id}`,
            type: 'specialty',
            specialtyId: s.id,
            title: s.name,
            subtitle: 'Specialty',
            tags: [],
            createdAt: s.createdAt.getTime(),
        };
    }
}
exports.CareSearchMapper = CareSearchMapper;
//# sourceMappingURL=care-search.mapper.js.map