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
exports.DeliveryService = void 0;
// cannasaas-api/src/modules/delivery/delivery.service.ts
var common_1 = require("@nestjs/common");
var delivery_entity_1 = require("./entities/delivery.entity");
var STATUS_FLOW = [
    delivery_entity_1.DeliveryStatus.PENDING, delivery_entity_1.DeliveryStatus.ASSIGNED,
    delivery_entity_1.DeliveryStatus.PICKED_UP, delivery_entity_1.DeliveryStatus.IN_TRANSIT,
    delivery_entity_1.DeliveryStatus.ARRIVING, delivery_entity_1.DeliveryStatus.DELIVERED,
];
var DeliveryService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DeliveryService = _classThis = /** @class */ (function () {
        function DeliveryService_1(deliveryRepo, notifications) {
            this.deliveryRepo = deliveryRepo;
            this.notifications = notifications;
            this.logger = new common_1.Logger(DeliveryService.name);
        }
        DeliveryService_1.prototype.assignDriver = function (deliveryId, driverId, driverName) {
            return __awaiter(this, void 0, void 0, function () {
                var delivery;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.deliveryRepo.findOneOrFail({
                                where: { id: deliveryId },
                            })];
                        case 1:
                            delivery = _a.sent();
                            delivery.driverId = driverId;
                            delivery.driverName = driverName;
                            delivery.status = delivery_entity_1.DeliveryStatus.ASSIGNED;
                            delivery.assignedAt = new Date();
                            return [4 /*yield*/, this.deliveryRepo.save(delivery)];
                        case 2:
                            _a.sent();
                            this.notifications.sendToOrder(delivery.orderId, 'delivery:assigned', {
                                driverName: driverName,
                                estimatedMinutes: delivery.estimatedMinutes,
                            });
                            return [2 /*return*/, delivery];
                    }
                });
            });
        };
        DeliveryService_1.prototype.updateStatus = function (deliveryId, status) {
            return __awaiter(this, void 0, void 0, function () {
                var delivery, currentIdx, newIdx;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.deliveryRepo.findOneOrFail({
                                where: { id: deliveryId },
                            })];
                        case 1:
                            delivery = _a.sent();
                            currentIdx = STATUS_FLOW.indexOf(delivery.status);
                            newIdx = STATUS_FLOW.indexOf(status);
                            if (newIdx <= currentIdx)
                                throw new Error("Cannot transition from ".concat(delivery.status, " to ").concat(status));
                            delivery.status = status;
                            if (status === delivery_entity_1.DeliveryStatus.PICKED_UP)
                                delivery.pickedUpAt = new Date();
                            if (status === delivery_entity_1.DeliveryStatus.DELIVERED)
                                delivery.deliveredAt = new Date();
                            return [4 /*yield*/, this.deliveryRepo.save(delivery)];
                        case 2:
                            _a.sent();
                            this.notifications.sendToOrder(delivery.orderId, 'delivery:status', {
                                status: status,
                                timestamp: new Date(),
                            });
                            return [2 /*return*/, delivery];
                    }
                });
            });
        };
        DeliveryService_1.prototype.updateLocation = function (deliveryId, lat, lng) {
            return __awaiter(this, void 0, void 0, function () {
                var delivery, distance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.deliveryRepo.findOneOrFail({
                                where: { id: deliveryId },
                            })];
                        case 1:
                            delivery = _a.sent();
                            delivery.currentLat = lat;
                            delivery.currentLng = lng;
                            distance = this.haversineDistance(lat, lng, delivery.lat, delivery.lng);
                            delivery.estimatedMinutes = Math.max(2, Math.round(distance / 0.5));
                            return [4 /*yield*/, this.deliveryRepo.save(delivery)];
                        case 2:
                            _a.sent();
                            this.notifications.sendToOrder(delivery.orderId, 'delivery:location', {
                                lat: lat,
                                lng: lng,
                                estimatedMinutes: delivery.estimatedMinutes,
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        DeliveryService_1.prototype.haversineDistance = function (lat1, lng1, lat2, lng2) {
            var R = 3959;
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLng = (lng2 - lng1) * Math.PI / 180;
            var a = Math.pow(Math.sin(dLat / 2), 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.pow(Math.sin(dLng / 2), 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        return DeliveryService_1;
    }());
    __setFunctionName(_classThis, "DeliveryService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DeliveryService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DeliveryService = _classThis;
}();
exports.DeliveryService = DeliveryService;
