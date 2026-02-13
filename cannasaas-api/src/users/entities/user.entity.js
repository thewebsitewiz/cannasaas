"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserRole = void 0;
var typeorm_1 = require("typeorm");
var base_entity_1 = require("../../common/entities/base.entity");
var class_transformer_1 = require("class-transformer");
var tenant_entity_1 = require("../../tenants/entities/tenant.entity");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ORG_ADMIN"] = "org_admin";
    UserRole["DISPENSARY_MANAGER"] = "dispensary_manager";
    UserRole["BUDTENDER"] = "budtender";
    UserRole["CUSTOMER"] = "customer";
})(UserRole || (exports.UserRole = UserRole = {}));
var User = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('users')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = base_entity_1.BaseEntity;
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _passwordHash_decorators;
    var _passwordHash_initializers = [];
    var _passwordHash_extraInitializers = [];
    var _firstName_decorators;
    var _firstName_initializers = [];
    var _firstName_extraInitializers = [];
    var _lastName_decorators;
    var _lastName_initializers = [];
    var _lastName_extraInitializers = [];
    var _role_decorators;
    var _role_initializers = [];
    var _role_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _isEmailVerified_decorators;
    var _isEmailVerified_initializers = [];
    var _isEmailVerified_extraInitializers = [];
    var _emailVerificationToken_decorators;
    var _emailVerificationToken_initializers = [];
    var _emailVerificationToken_extraInitializers = [];
    var _passwordResetToken_decorators;
    var _passwordResetToken_initializers = [];
    var _passwordResetToken_extraInitializers = [];
    var _passwordResetExpires_decorators;
    var _passwordResetExpires_initializers = [];
    var _passwordResetExpires_extraInitializers = [];
    var _tenant_decorators;
    var _tenant_initializers = [];
    var _tenant_extraInitializers = [];
    var User = _classThis = /** @class */ (function (_super) {
        __extends(User_1, _super);
        function User_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.email = __runInitializers(_this, _email_initializers, void 0);
            _this.passwordHash = (__runInitializers(_this, _email_extraInitializers), __runInitializers(_this, _passwordHash_initializers, void 0));
            _this.firstName = (__runInitializers(_this, _passwordHash_extraInitializers), __runInitializers(_this, _firstName_initializers, void 0));
            _this.lastName = (__runInitializers(_this, _firstName_extraInitializers), __runInitializers(_this, _lastName_initializers, void 0));
            _this.role = (__runInitializers(_this, _lastName_extraInitializers), __runInitializers(_this, _role_initializers, void 0));
            _this.isActive = (__runInitializers(_this, _role_extraInitializers), __runInitializers(_this, _isActive_initializers, void 0));
            _this.isEmailVerified = (__runInitializers(_this, _isActive_extraInitializers), __runInitializers(_this, _isEmailVerified_initializers, void 0));
            _this.emailVerificationToken = (__runInitializers(_this, _isEmailVerified_extraInitializers), __runInitializers(_this, _emailVerificationToken_initializers, void 0));
            _this.passwordResetToken = (__runInitializers(_this, _emailVerificationToken_extraInitializers), __runInitializers(_this, _passwordResetToken_initializers, void 0));
            _this.passwordResetExpires = (__runInitializers(_this, _passwordResetToken_extraInitializers), __runInitializers(_this, _passwordResetExpires_initializers, void 0));
            _this.tenant = (__runInitializers(_this, _passwordResetExpires_extraInitializers), __runInitializers(_this, _tenant_initializers, void 0));
            __runInitializers(_this, _tenant_extraInitializers);
            return _this;
        }
        return User_1;
    }(_classSuper));
    __setFunctionName(_classThis, "User");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _email_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _passwordHash_decorators = [(0, typeorm_1.Column)({ name: 'password_hash', type: 'varchar', length: 255 }), (0, class_transformer_1.Exclude)()];
        _firstName_decorators = [(0, typeorm_1.Column)({ name: 'first_name', type: 'varchar', length: 100, nullable: true })];
        _lastName_decorators = [(0, typeorm_1.Column)({ name: 'last_name', type: 'varchar', length: 100, nullable: true })];
        _role_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: UserRole,
                default: UserRole.CUSTOMER,
            })];
        _isActive_decorators = [(0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true })];
        _isEmailVerified_decorators = [(0, typeorm_1.Column)({ name: 'is_email_verified', type: 'boolean', default: false })];
        _emailVerificationToken_decorators = [(0, typeorm_1.Column)({ name: 'email_verification_token', nullable: true }), (0, class_transformer_1.Exclude)()];
        _passwordResetToken_decorators = [(0, typeorm_1.Column)({ name: 'password_reset_token', nullable: true }), (0, class_transformer_1.Exclude)()];
        _passwordResetExpires_decorators = [(0, typeorm_1.Column)({ name: 'password_reset_expires', type: 'timestamp', nullable: true }), (0, class_transformer_1.Exclude)()];
        _tenant_decorators = [(0, typeorm_1.ManyToOne)(function () { return tenant_entity_1.Tenant; }, { eager: true }), (0, typeorm_1.JoinColumn)({ name: 'tenant_id' })];
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _passwordHash_decorators, { kind: "field", name: "passwordHash", static: false, private: false, access: { has: function (obj) { return "passwordHash" in obj; }, get: function (obj) { return obj.passwordHash; }, set: function (obj, value) { obj.passwordHash = value; } }, metadata: _metadata }, _passwordHash_initializers, _passwordHash_extraInitializers);
        __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: function (obj) { return "firstName" in obj; }, get: function (obj) { return obj.firstName; }, set: function (obj, value) { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
        __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: function (obj) { return "lastName" in obj; }, get: function (obj) { return obj.lastName; }, set: function (obj, value) { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: function (obj) { return "role" in obj; }, get: function (obj) { return obj.role; }, set: function (obj, value) { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _isEmailVerified_decorators, { kind: "field", name: "isEmailVerified", static: false, private: false, access: { has: function (obj) { return "isEmailVerified" in obj; }, get: function (obj) { return obj.isEmailVerified; }, set: function (obj, value) { obj.isEmailVerified = value; } }, metadata: _metadata }, _isEmailVerified_initializers, _isEmailVerified_extraInitializers);
        __esDecorate(null, null, _emailVerificationToken_decorators, { kind: "field", name: "emailVerificationToken", static: false, private: false, access: { has: function (obj) { return "emailVerificationToken" in obj; }, get: function (obj) { return obj.emailVerificationToken; }, set: function (obj, value) { obj.emailVerificationToken = value; } }, metadata: _metadata }, _emailVerificationToken_initializers, _emailVerificationToken_extraInitializers);
        __esDecorate(null, null, _passwordResetToken_decorators, { kind: "field", name: "passwordResetToken", static: false, private: false, access: { has: function (obj) { return "passwordResetToken" in obj; }, get: function (obj) { return obj.passwordResetToken; }, set: function (obj, value) { obj.passwordResetToken = value; } }, metadata: _metadata }, _passwordResetToken_initializers, _passwordResetToken_extraInitializers);
        __esDecorate(null, null, _passwordResetExpires_decorators, { kind: "field", name: "passwordResetExpires", static: false, private: false, access: { has: function (obj) { return "passwordResetExpires" in obj; }, get: function (obj) { return obj.passwordResetExpires; }, set: function (obj, value) { obj.passwordResetExpires = value; } }, metadata: _metadata }, _passwordResetExpires_initializers, _passwordResetExpires_extraInitializers);
        __esDecorate(null, null, _tenant_decorators, { kind: "field", name: "tenant", static: false, private: false, access: { has: function (obj) { return "tenant" in obj; }, get: function (obj) { return obj.tenant; }, set: function (obj, value) { obj.tenant = value; } }, metadata: _metadata }, _tenant_initializers, _tenant_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
}();
exports.User = User;
