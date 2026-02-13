"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
var common_1 = require("@nestjs/common");
var ProductsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ProductsService = _classThis = /** @class */ (function () {
        function ProductsService_1(productRepository, variantRepository, imageRepository, categoryRepository) {
            this.productRepository = productRepository;
            this.variantRepository = variantRepository;
            this.imageRepository = imageRepository;
            this.categoryRepository = categoryRepository;
        }
        // --- Categories ---
        ProductsService_1.prototype.createCategory = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var category;
                return __generator(this, function (_a) {
                    category = this.categoryRepository.create(dto);
                    return [2 /*return*/, this.categoryRepository.save(category)];
                });
            });
        };
        ProductsService_1.prototype.findCategories = function (dispensaryId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.categoryRepository.find({
                            where: { dispensaryId: dispensaryId, isActive: true },
                            order: { sortOrder: 'ASC', name: 'ASC' },
                            relations: ['products'],
                        })];
                });
            });
        };
        // --- Products ---
        ProductsService_1.prototype.createProduct = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var variants, productData, product, savedProduct, variantEntities;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            variants = dto.variants, productData = __rest(dto, ["variants"]);
                            product = this.productRepository.create(productData);
                            return [4 /*yield*/, this.productRepository.save(product)];
                        case 1:
                            savedProduct = _a.sent();
                            if (!(variants && variants.length > 0)) return [3 /*break*/, 3];
                            variantEntities = variants.map(function (v, index) {
                                return _this.variantRepository.create(__assign(__assign({}, v), { productId: savedProduct.id, sortOrder: index }));
                            });
                            return [4 /*yield*/, this.variantRepository.save(variantEntities)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, this.findOneProduct(savedProduct.id)];
                    }
                });
            });
        };
        ProductsService_1.prototype.findProducts = function (dispensaryId, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var qb;
                return __generator(this, function (_a) {
                    qb = this.productRepository
                        .createQueryBuilder('product')
                        .leftJoinAndSelect('product.variants', 'variant')
                        .leftJoinAndSelect('product.images', 'image')
                        .leftJoinAndSelect('product.category', 'category')
                        .where('product.dispensaryId = :dispensaryId', { dispensaryId: dispensaryId })
                        .andWhere('product.isActive = :isActive', { isActive: true });
                    if (filters === null || filters === void 0 ? void 0 : filters.categoryId) {
                        qb.andWhere('product.categoryId = :categoryId', {
                            categoryId: filters.categoryId,
                        });
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.productType) {
                        qb.andWhere('product.productType = :productType', {
                            productType: filters.productType,
                        });
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.strainType) {
                        qb.andWhere('product.strainType = :strainType', {
                            strainType: filters.strainType,
                        });
                    }
                    if ((filters === null || filters === void 0 ? void 0 : filters.isFeatured) !== undefined) {
                        qb.andWhere('product.isFeatured = :isFeatured', {
                            isFeatured: filters.isFeatured,
                        });
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.search) {
                        qb.andWhere('(product.name ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)', { search: "%".concat(filters.search, "%") });
                    }
                    qb.orderBy('product.isFeatured', 'DESC')
                        .addOrderBy('product.name', 'ASC')
                        .addOrderBy('variant.sortOrder', 'ASC')
                        .addOrderBy('image.sortOrder', 'ASC');
                    return [2 /*return*/, qb.getMany()];
                });
            });
        };
        ProductsService_1.prototype.findOneProduct = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.productRepository.findOne({
                                where: { id: id },
                                relations: ['variants', 'images', 'category'],
                            })];
                        case 1:
                            product = _a.sent();
                            if (!product) {
                                throw new common_1.NotFoundException("Product with ID ".concat(id, " not found"));
                            }
                            return [2 /*return*/, product];
                    }
                });
            });
        };
        ProductsService_1.prototype.updateProduct = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var product, variants, productData, variantEntities;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOneProduct(id)];
                        case 1:
                            product = _a.sent();
                            variants = dto.variants, productData = __rest(dto, ["variants"]);
                            Object.assign(product, productData);
                            return [4 /*yield*/, this.productRepository.save(product)];
                        case 2:
                            _a.sent();
                            if (!variants) return [3 /*break*/, 5];
                            // Remove existing variants and replace
                            return [4 /*yield*/, this.variantRepository.delete({ productId: id })];
                        case 3:
                            // Remove existing variants and replace
                            _a.sent();
                            variantEntities = variants.map(function (v, index) {
                                return _this.variantRepository.create(__assign(__assign({}, v), { productId: id, sortOrder: index }));
                            });
                            return [4 /*yield*/, this.variantRepository.save(variantEntities)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/, this.findOneProduct(id)];
                    }
                });
            });
        };
        ProductsService_1.prototype.removeProduct = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOneProduct(id)];
                        case 1:
                            product = _a.sent();
                            return [4 /*yield*/, this.productRepository.remove(product)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        // --- Inventory ---
        ProductsService_1.prototype.updateInventory = function (variantId, quantityChange) {
            return __awaiter(this, void 0, void 0, function () {
                var variant;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.variantRepository.findOne({
                                where: { id: variantId },
                            })];
                        case 1:
                            variant = _a.sent();
                            if (!variant) {
                                throw new common_1.NotFoundException("Variant with ID ".concat(variantId, " not found"));
                            }
                            variant.quantity += quantityChange;
                            if (variant.quantity < 0)
                                variant.quantity = 0;
                            return [2 /*return*/, this.variantRepository.save(variant)];
                    }
                });
            });
        };
        ProductsService_1.prototype.getLowStockProducts = function (dispensaryId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.variantRepository
                            .createQueryBuilder('variant')
                            .leftJoinAndSelect('variant.product', 'product')
                            .where('product.dispensaryId = :dispensaryId', { dispensaryId: dispensaryId })
                            .andWhere('variant.quantity <= variant.lowStockThreshold')
                            .andWhere('variant.isActive = true')
                            .getMany()];
                });
            });
        };
        // --- Product Images ---
        ProductsService_1.prototype.addProductImage = function (productId_1, imageUrl_1) {
            return __awaiter(this, arguments, void 0, function (productId, imageUrl, isPrimary) {
                var image;
                if (isPrimary === void 0) { isPrimary = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!isPrimary) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.imageRepository.update({ productId: productId }, { isPrimary: false })];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            image = this.imageRepository.create({
                                productId: productId,
                                imageUrl: imageUrl,
                                isPrimary: isPrimary,
                            });
                            return [2 /*return*/, this.imageRepository.save(image)];
                    }
                });
            });
        };
        return ProductsService_1;
    }());
    __setFunctionName(_classThis, "ProductsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductsService = _classThis;
}();
exports.ProductsService = ProductsService;
