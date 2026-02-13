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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./entities/review.entity");
const orders_service_1 = require("../../orders/orders.service");
let ReviewService = class ReviewService {
    constructor(reviewRepo, orderService) {
        this.reviewRepo = reviewRepo;
        this.orderService = orderService;
    }
    async create(userId, dto) {
        const existing = await this.reviewRepo.findOne({
            where: { userId, productId: dto.productId },
        });
        if (existing)
            throw new common_1.BadRequestException('You already reviewed this product');
        const hasPurchased = await this.orderService.hasUserPurchasedProduct(userId, dto.productId);
        const review = this.reviewRepo.create({
            ...dto, userId, verifiedPurchase: hasPurchased,
            status: review_entity_1.ReviewStatus.PENDING,
        });
        return this.reviewRepo.save(review);
    }
    async getProductReviews(productId, page = 1, limit = 10) {
        const [reviews, total] = await this.reviewRepo.findAndCount({
            where: { productId, status: review_entity_1.ReviewStatus.APPROVED },
            relations: ['user'],
            order: { helpfulVotes: 'DESC', createdAt: 'DESC' },
            skip: (page - 1) * limit, take: limit,
        });
        return { reviews, total, page, totalPages: Math.ceil(total / limit) };
    }
    async getAggregateRating(productId) {
        const result = await this.reviewRepo
            .createQueryBuilder('r')
            .select('AVG(r.rating)', 'average')
            .addSelect('COUNT(r.id)', 'count')
            .addSelect('SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END)', 'five')
            .addSelect('SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END)', 'four')
            .addSelect('SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END)', 'three')
            .addSelect('SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END)', 'two')
            .addSelect('SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END)', 'one')
            .where('r.productId = :productId', { productId })
            .andWhere('r.status = :status', { status: review_entity_1.ReviewStatus.APPROVED })
            .getRawOne();
        return {
            average: parseFloat(result.average) || 0,
            count: parseInt(result.count) || 0,
            distribution: {
                5: parseInt(result.five) || 0, 4: parseInt(result.four) || 0,
                3: parseInt(result.three) || 0, 2: parseInt(result.two) || 0,
                1: parseInt(result.one) || 0,
            },
        };
    }
    async voteHelpful(reviewId, userId) {
        await this.reviewRepo.increment({ id: reviewId }, 'helpfulVotes', 1);
    }
    async moderate(reviewId, status) {
        await this.reviewRepo.update(reviewId, { status });
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeof (_a = typeof orders_service_1.OrderService !== "undefined" && orders_service_1.OrderService) === "function" ? _a : Object])
], ReviewService);
//# sourceMappingURL=review.service.js.map