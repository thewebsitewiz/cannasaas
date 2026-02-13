"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
const nanoid_1 = require("nanoid");
let RequestLoggerMiddleware = class RequestLoggerMiddleware {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    use(req, res, next) {
        const requestId = (0, nanoid_1.nanoid)(12);
        const start = Date.now();
        req['requestId'] = requestId;
        res.setHeader('X-Request-ID', requestId);
        res.on('finish', () => {
            this.logger.log({
                requestId, method: req.method, url: req.originalUrl,
                statusCode: res.statusCode, duration: `${Date.now() - start}ms`,
                orgId: req['organizationId'], userId: req['user']?.['id'],
                ip: req.ip, userAgent: req.get('user-agent'),
            });
        });
        next();
    }
};
exports.RequestLoggerMiddleware = RequestLoggerMiddleware;
exports.RequestLoggerMiddleware = RequestLoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestLoggerMiddleware);
//# sourceMappingURL=request-logger.middleware.js.map