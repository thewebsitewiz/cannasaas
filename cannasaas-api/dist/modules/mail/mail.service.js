"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
    }
    async sendBetaInvitation(data) {
        this.logger.log(`[STUB] Beta invitation to ${data.to} with code ${data.code}`);
    }
    async sendStaffInvitation(data) {
        this.logger.log(`[STUB] Staff invitation to ${data.to} for org ${data.orgName}`);
    }
    async sendAbandonedCartEmail(data) {
        this.logger.log(`[STUB] Abandoned cart email to ${data.to}`);
    }
    async sendTemplateEmail(data) {
        this.logger.log(`[STUB] Template email to ${data.to}: ${data.subject}`);
    }
    async sendWinBackEmail(data) {
        this.logger.log(`[STUB] Win-back email to ${data.to}`);
    }
    async sendEmail(data) {
        this.logger.log(`[STUB] Email to ${data.to}: ${data.subject}`);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)()
], MailService);
//# sourceMappingURL=mail.service.js.map