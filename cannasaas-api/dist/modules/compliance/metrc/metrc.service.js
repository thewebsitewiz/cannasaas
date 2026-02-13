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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetrcService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let MetrcService = class MetrcService {
    constructor(config) {
        this.config = config;
        const vendorKey = this.config.get('METRC_VENDOR_KEY');
        const userKey = this.config.get('METRC_USER_KEY');
        this.license = this.config.get('METRC_LICENSE_NUMBER');
        this.client = axios_1.default.create({
            baseURL: this.config.get('METRC_BASE_URL'),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(`${vendorKey}:${userKey}`).toString('base64')}`,
            },
            timeout: 30000,
        });
    }
    async reportSale(sale) {
        try {
            await this.client.post(`/sales/v2/receipts?licenseNumber=${this.license}`, [sale]);
        }
        catch (error) {
            throw new common_1.HttpException('METRC sync failed', 502);
        }
    }
    async getActivePackages() {
        const response = await this.client.get(`/packages/v2/active?licenseNumber=${this.license}`);
        return response.data;
    }
    async adjustPackage(label, quantity, reason, adjustDate) {
        await this.client.post(`/packages/v2/adjust?licenseNumber=${this.license}`, [{ Label: label, Quantity: quantity, UnitOfMeasure: 'Grams',
                AdjustmentReason: reason, AdjustmentDate: adjustDate }]);
    }
    async healthCheck() {
        try {
            await this.client.get(`/facilities/v2?licenseNumber=${this.license}`);
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.MetrcService = MetrcService;
exports.MetrcService = MetrcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MetrcService);
//# sourceMappingURL=metrc.service.js.map