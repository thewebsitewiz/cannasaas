"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
let StripeService = StripeService_1 = class StripeService {
    constructor() {
        this.logger = new common_1.Logger(StripeService_1.name);
    }
    async createConnectedAccount(data) {
        this.logger.log(`[STUB] Creating Stripe connected account for ${data.email}`);
        return { id: `acct_stub_${Date.now()}` };
    }
    async createAccountLink(accountId, returnUrl, refreshUrl) {
        this.logger.log(`[STUB] Creating account link for ${accountId}`);
        return { url: returnUrl };
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)()
], StripeService);
//# sourceMappingURL=stripe.service.js.map