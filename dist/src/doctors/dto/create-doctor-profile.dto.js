"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDoctorProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateDoctorProfileDto {
    specialtyId;
    hospitalName;
    workingHours;
    experience;
    consultationFee;
    about;
}
exports.CreateDoctorProfileDto = CreateDoctorProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-specialty' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorProfileDto.prototype, "specialtyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'El-Nasr Hospital' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorProfileDto.prototype, "hospitalName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9:30am - 8:00pm' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorProfileDto.prototype, "workingHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Years of experience' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDoctorProfileDto.prototype, "experience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50.0, description: 'Consultation fee in USD' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDoctorProfileDto.prototype, "consultationFee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'About the doctor...', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorProfileDto.prototype, "about", void 0);
//# sourceMappingURL=create-doctor-profile.dto.js.map