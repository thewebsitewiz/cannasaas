"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
var common_1 = require("@nestjs/common");
var order_entity_1 = require("./entities/order.entity");
var OrdersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var OrdersService = _classThis = /** @class */ (function () {
        function OrdersService_1(orderRepository, orderItemRepository, statusHistoryRepository, cartService, productsService, dataSource, complianceService) {
            this.orderRepository = orderRepository;
            this.orderItemRepository = orderItemRepository;
            this.statusHistoryRepository = statusHistoryRepository;
            this.cartService = cartService;
            this.productsService = productsService;
            this.dataSource = dataSource;
            this.complianceService = complianceService;
        }
        OrdersService_1.prototype.checkout = function (userId, tenantId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var cartSummary, queryRunner, subtotal, taxRate, exciseTaxRate, taxAmount, exciseTax, total, orderNumber, order, savedOrder, _i, _a, cartItem, orderItem, statusHistory, fullOrder, error_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.cartService.getCartSummary(userId, dto.dispensaryId)];
                        case 1:
                            cartSummary = _b.sent();
                            if (cartSummary.items.length === 0) {
                                throw new common_1.BadRequestException('Cart is empty');
                            }
                            queryRunner = this.dataSource.createQueryRunner();
                            return [4 /*yield*/, queryRunner.connect()];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, queryRunner.startTransaction()];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4:
                            _b.trys.push([4, 17, 19, 21]);
                            subtotal = cartSummary.subtotal;
                            taxRate = 0.08875;
                            exciseTaxRate = 0.09;
                            taxAmount = Math.round(subtotal * taxRate * 100) / 100;
                            exciseTax = Math.round(subtotal * exciseTaxRate * 100) / 100;
                            total = subtotal + taxAmount + exciseTax;
                            return [4 /*yield*/, this.generateOrderNumber(dto.dispensaryId)];
                        case 5:
                            orderNumber = _b.sent();
                            order = this.orderRepository.create({
                                orderNumber: orderNumber,
                                userId: userId,
                                dispensaryId: dto.dispensaryId,
                                tenantId: tenantId,
                                subtotal: subtotal,
                                taxAmount: taxAmount,
                                exciseTax: exciseTax,
                                total: total,
                                fulfillmentType: dto.fulfillmentType,
                                customerName: dto.customerName,
                                customerEmail: dto.customerEmail,
                                customerPhone: dto.customerPhone,
                                deliveryAddress: dto.deliveryAddress,
                                notes: dto.notes,
                                status: order_entity_1.OrderStatus.PENDING,
                            });
                            return [4 /*yield*/, queryRunner.manager.save(order)];
                        case 6:
                            savedOrder = _b.sent();
                            _i = 0, _a = cartSummary.items;
                            _b.label = 7;
                        case 7:
                            if (!(_i < _a.length)) return [3 /*break*/, 11];
                            cartItem = _a[_i];
                            orderItem = this.orderItemRepository.create({
                                orderId: savedOrder.id,
                                productId: cartItem.variant.product.id,
                                variantId: cartItem.variantId,
                                productName: cartItem.variant.product.name,
                                variantName: cartItem.variant.name,
                                unitPrice: cartItem.unitPrice,
                                quantity: cartItem.quantity,
                                lineTotal: Number(cartItem.unitPrice) * cartItem.quantity,
                                batchNumber: cartItem.variant.product.batchNumber,
                                licenseNumber: cartItem.variant.product.licenseNumber,
                            });
                            return [4 /*yield*/, queryRunner.manager.save(orderItem)];
                        case 8:
                            _b.sent();
                            // Decrement inventory
                            return [4 /*yield*/, this.productsService.updateInventory(cartItem.variantId, -cartItem.quantity)];
                        case 9:
                            // Decrement inventory
                            _b.sent();
                            _b.label = 10;
                        case 10:
                            _i++;
                            return [3 /*break*/, 7];
                        case 11:
                            statusHistory = this.statusHistoryRepository.create({
                                orderId: savedOrder.id,
                                fromStatus: null,
                                toStatus: order_entity_1.OrderStatus.PENDING,
                                changedBy: userId,
                                notes: 'Order placed',
                            });
                            return [4 /*yield*/, queryRunner.manager.save(statusHistory)];
                        case 12:
                            _b.sent();
                            // Clear the cart
                            return [4 /*yield*/, this.cartService.clearCart(userId, dto.dispensaryId)];
                        case 13:
                            // Clear the cart
                            _b.sent();
                            return [4 /*yield*/, queryRunner.commitTransaction()];
                        case 14:
                            _b.sent();
                            return [4 /*yield*/, this.findOne(savedOrder.id)];
                        case 15:
                            fullOrder = _b.sent();
                            return [4 /*yield*/, this.complianceService.logSale(fullOrder, userId)];
                        case 16:
                            _b.sent();
                            return [2 /*return*/, this.findOne(savedOrder.id)];
                        case 17:
                            error_1 = _b.sent();
                            return [4 /*yield*/, queryRunner.rollbackTransaction()];
                        case 18:
                            _b.sent();
                            throw error_1;
                        case 19: return [4 /*yield*/, queryRunner.release()];
                        case 20:
                            _b.sent();
                            return [7 /*endfinally*/];
                        case 21: return [2 /*return*/];
                    }
                });
            });
        };
        OrdersService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var order;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.orderRepository.findOne({
                                where: { id: id },
                                relations: ['items', 'statusHistory'],
                                order: { statusHistory: { createdAt: 'ASC' } },
                            })];
                        case 1:
                            order = _a.sent();
                            if (!order) {
                                throw new common_1.NotFoundException("Order ".concat(id, " not found"));
                            }
                            return [2 /*return*/, order];
                    }
                });
            });
        };
        OrdersService_1.prototype.findByUser = function (userId, dispensaryId) {
            return __awaiter(this, void 0, void 0, function () {
                var where;
                return __generator(this, function (_a) {
                    where = { userId: userId };
                    if (dispensaryId)
                        where.dispensaryId = dispensaryId;
                    return [2 /*return*/, this.orderRepository.find({
                            where: where,
                            relations: ['items'],
                            order: { createdAt: 'DESC' },
                        })];
                });
            });
        };
        OrdersService_1.prototype.findByDispensary = function (dispensaryId, status) {
            return __awaiter(this, void 0, void 0, function () {
                var where;
                return __generator(this, function (_a) {
                    where = { dispensaryId: dispensaryId };
                    if (status)
                        where.status = status;
                    return [2 /*return*/, this.orderRepository.find({
                            where: where,
                            relations: ['items'],
                            order: { createdAt: 'DESC' },
                        })];
                });
            });
        };
        OrdersService_1.prototype.updateStatus = function (orderId, newStatus, changedBy, notes) {
            return __awaiter(this, void 0, void 0, function () {
                var order, oldStatus, _i, _a, item, statusHistory;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(orderId)];
                        case 1:
                            order = _b.sent();
                            oldStatus = order.status;
                            // Validate status transition
                            this.validateStatusTransition(oldStatus, newStatus);
                            order.status = newStatus;
                            // Set timestamps
                            if (newStatus === order_entity_1.OrderStatus.CONFIRMED)
                                order.confirmedAt = new Date();
                            if (newStatus === order_entity_1.OrderStatus.COMPLETED)
                                order.completedAt = new Date();
                            if (!(newStatus === order_entity_1.OrderStatus.CANCELLED)) return [3 /*break*/, 5];
                            order.cancelledAt = new Date();
                            _i = 0, _a = order.items;
                            _b.label = 2;
                        case 2:
                            if (!(_i < _a.length)) return [3 /*break*/, 5];
                            item = _a[_i];
                            return [4 /*yield*/, this.productsService.updateInventory(item.variantId, item.quantity)];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [4 /*yield*/, this.orderRepository.save(order)];
                        case 6:
                            _b.sent();
                            statusHistory = this.statusHistoryRepository.create({
                                orderId: orderId,
                                fromStatus: oldStatus,
                                toStatus: newStatus,
                                changedBy: changedBy,
                                notes: notes,
                            });
                            return [4 /*yield*/, this.statusHistoryRepository.save(statusHistory)];
                        case 7:
                            _b.sent();
                            return [2 /*return*/, this.findOne(orderId)];
                    }
                });
            });
        };
        OrdersService_1.prototype.validateStatusTransition = function (from, to) {
            var _a;
            var _b;
            var validTransitions = (_a = {},
                _a[order_entity_1.OrderStatus.PENDING] = [order_entity_1.OrderStatus.CONFIRMED, order_entity_1.OrderStatus.CANCELLED],
                _a[order_entity_1.OrderStatus.CONFIRMED] = [order_entity_1.OrderStatus.PREPARING, order_entity_1.OrderStatus.CANCELLED],
                _a[order_entity_1.OrderStatus.PREPARING] = [
                    order_entity_1.OrderStatus.READY_FOR_PICKUP,
                    order_entity_1.OrderStatus.OUT_FOR_DELIVERY,
                    order_entity_1.OrderStatus.CANCELLED,
                ],
                _a[order_entity_1.OrderStatus.READY_FOR_PICKUP] = [
                    order_entity_1.OrderStatus.COMPLETED,
                    order_entity_1.OrderStatus.CANCELLED,
                ],
                _a[order_entity_1.OrderStatus.OUT_FOR_DELIVERY] = [
                    order_entity_1.OrderStatus.COMPLETED,
                    order_entity_1.OrderStatus.CANCELLED,
                ],
                _a[order_entity_1.OrderStatus.COMPLETED] = [order_entity_1.OrderStatus.REFUNDED],
                _a[order_entity_1.OrderStatus.CANCELLED] = [],
                _a[order_entity_1.OrderStatus.REFUNDED] = [],
                _a);
            if (!((_b = validTransitions[from]) === null || _b === void 0 ? void 0 : _b.includes(to))) {
                throw new common_1.BadRequestException("Cannot transition from ".concat(from, " to ").concat(to));
            }
        };
        OrdersService_1.prototype.generateOrderNumber = function (dispensaryId) {
            return __awaiter(this, void 0, void 0, function () {
                var today, count, seq;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                            return [4 /*yield*/, this.orderRepository.count({
                                    where: { dispensaryId: dispensaryId },
                                })];
                        case 1:
                            count = _a.sent();
                            seq = String(count + 1).padStart(4, '0');
                            return [2 /*return*/, "ORD-".concat(today, "-").concat(seq)];
                    }
                });
            });
        };
        return OrdersService_1;
    }());
    __setFunctionName(_classThis, "OrdersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrdersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrdersService = _classThis;
}();
exports.OrdersService = OrdersService;
