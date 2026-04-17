"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonApiResponses = CommonApiResponses;
exports.CreateApiResponses = CreateApiResponses;
exports.UpdateApiResponses = UpdateApiResponses;
exports.DeleteApiResponses = DeleteApiResponses;
exports.GetOneApiResponses = GetOneApiResponses;
exports.GetManyApiResponses = GetManyApiResponses;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
function CommonApiResponses() {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiNotFoundResponse)({ description: 'Resource not found.' }), (0, swagger_1.ApiInternalServerErrorResponse)({ description: 'Unexpected server error.' }));
}
function CreateApiResponses(resourceName = 'Resource') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 201,
        description: `${resourceName} created successfully.`
    }), (0, swagger_1.ApiBadRequestResponse)({ description: 'Bad Request - Invalid input data.' }), (0, swagger_1.ApiInternalServerErrorResponse)({ description: 'Unexpected server error.' }));
}
function UpdateApiResponses(resourceName = 'Resource') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 200,
        description: `${resourceName} updated successfully.`
    }), (0, swagger_1.ApiNotFoundResponse)({ description: `${resourceName} not found.` }), (0, swagger_1.ApiBadRequestResponse)({ description: 'Bad Request - Invalid input data.' }), (0, swagger_1.ApiInternalServerErrorResponse)({ description: 'Unexpected server error.' }));
}
function DeleteApiResponses(resourceName = 'Resource') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 200,
        description: `${resourceName} deleted successfully.`
    }), (0, swagger_1.ApiNotFoundResponse)({ description: `${resourceName} not found.` }), (0, swagger_1.ApiInternalServerErrorResponse)({ description: 'Unexpected server error.' }));
}
function GetOneApiResponses(resourceName = 'Resource') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 200,
        description: `${resourceName} retrieved successfully.`
    }), (0, swagger_1.ApiNotFoundResponse)({ description: `${resourceName} not found.` }), (0, swagger_1.ApiInternalServerErrorResponse)({ description: 'Unexpected server error.' }));
}
function GetManyApiResponses(resourceName = 'Resources') {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 200,
        description: `${resourceName} retrieved successfully.`
    }), (0, swagger_1.ApiInternalServerErrorResponse)({ description: 'Unexpected server error.' }));
}
//# sourceMappingURL=api-responses.util.js.map