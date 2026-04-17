"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const CONFLICT_STATUS = common_1.HttpStatus.CONFLICT;
const BAD_REQUEST_STATUS = common_1.HttpStatus.BAD_REQUEST;
const NOT_FOUND_STATUS = common_1.HttpStatus.NOT_FOUND;
const INTERNAL_ERROR_STATUS = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
let PrismaExceptionFilter = class PrismaExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const path = request?.url ?? '';
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const body = this.buildKnownRequestErrorBody(exception, path);
            response.status(body.statusCode).json(body);
            return;
        }
        if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            const body = {
                statusCode: BAD_REQUEST_STATUS,
                message: 'Invalid request data',
                code: 'VALIDATION_ERROR',
                path,
            };
            console.error("🔥 PRISMA ERROR:", exception);
            response.status(body.statusCode).json(body);
            return;
        }
        const body = {
            statusCode: INTERNAL_ERROR_STATUS,
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            path,
        };
        response.status(body.statusCode).json(body);
    }
    buildKnownRequestErrorBody(error, path) {
        switch (error.code) {
            case 'P2002': {
                return {
                    statusCode: CONFLICT_STATUS,
                    message: 'Unique constraint violation',
                    code: error.code,
                    path,
                };
            }
            case 'P2003': {
                return {
                    statusCode: CONFLICT_STATUS,
                    message: 'Foreign key constraint failed',
                    code: error.code,
                    path,
                };
            }
            case 'P2025': {
                return {
                    statusCode: NOT_FOUND_STATUS,
                    message: 'Record not found',
                    code: error.code,
                    path,
                };
            }
            default: {
                return {
                    statusCode: BAD_REQUEST_STATUS,
                    message: 'Database request error',
                    code: error.code,
                    path,
                };
            }
        }
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError, client_1.Prisma.PrismaClientValidationError)
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map