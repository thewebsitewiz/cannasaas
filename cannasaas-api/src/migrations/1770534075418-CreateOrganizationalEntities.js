"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOrganizationalEntities1770534075418 = void 0;
var CreateOrganizationalEntities1770534075418 = /** @class */ (function () {
    function CreateOrganizationalEntities1770534075418() {
        this.name = 'CreateOrganizationalEntities1770534075418';
    }
    CreateOrganizationalEntities1770534075418.prototype.up = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("CREATE TABLE \"tenants\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"name\" character varying(255) NOT NULL, \"subdomain\" character varying(100) NOT NULL, \"created_at\" TIMESTAMP NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"UQ_21bb89e012fa5b58532009c1601\" UNIQUE (\"subdomain\"), CONSTRAINT \"PK_53be67a04681c66b87ee27c9321\" PRIMARY KEY (\"id\"))")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TYPE \"public\".\"users_role_enum\" AS ENUM('super_admin', 'org_admin', 'dispensary_manager', 'budtender', 'customer')")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"users\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"tenant_id\" uuid NOT NULL, \"created_at\" TIMESTAMP NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP NOT NULL DEFAULT now(), \"email\" character varying(255) NOT NULL, \"password_hash\" character varying(255) NOT NULL, \"first_name\" character varying(100), \"last_name\" character varying(100), \"role\" \"public\".\"users_role_enum\" NOT NULL DEFAULT 'customer', \"is_active\" boolean NOT NULL DEFAULT true, \"is_email_verified\" boolean NOT NULL DEFAULT false, \"email_verification_token\" character varying, \"password_reset_token\" character varying, \"password_reset_expires\" TIMESTAMP, CONSTRAINT \"PK_a3ffb1c0c8416b9fc6f907b7433\" PRIMARY KEY (\"id\"))")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"branding_configs\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"dispensary_id\" uuid NOT NULL, \"logo_url\" character varying(500), \"logo_dark_url\" character varying(500), \"favicon_url\" character varying(500), \"primary_color\" character varying(7) NOT NULL DEFAULT '#10b981', \"secondary_color\" character varying(7) NOT NULL DEFAULT '#3b82f6', \"accent_color\" character varying(7) NOT NULL DEFAULT '#8b5cf6', \"font_family\" character varying(100) NOT NULL DEFAULT 'Inter', \"custom_css\" text, \"created_at\" TIMESTAMP NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"UQ_3b0649d78b5c16f8a3d1cd18543\" UNIQUE (\"dispensary_id\"), CONSTRAINT \"REL_3b0649d78b5c16f8a3d1cd1854\" UNIQUE (\"dispensary_id\"), CONSTRAINT \"PK_218a0821821e255d0c72af92cd4\" PRIMARY KEY (\"id\"))")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"dispensaries\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"company_id\" uuid NOT NULL, \"name\" character varying(255) NOT NULL, \"slug\" character varying(100) NOT NULL, \"description\" text, \"street_address\" character varying(255) NOT NULL, \"city\" character varying(100) NOT NULL, \"state\" character varying(2) NOT NULL, \"zip_code\" character varying(10) NOT NULL, \"location\" geography(Point,4326), \"latitude\" numeric(10,7), \"longitude\" numeric(10,7), \"phone_number\" character varying(20), \"email\" character varying(255), \"website\" character varying(255), \"operating_hours\" jsonb, \"is_active\" boolean NOT NULL DEFAULT true, \"created_at\" TIMESTAMP NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"UQ_92d32ec6d6994580517a67a50ef\" UNIQUE (\"slug\"), CONSTRAINT \"PK_9f31589ebc8859f63b38cb482b7\" PRIMARY KEY (\"id\"))")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"companies\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"organization_id\" uuid NOT NULL, \"name\" character varying(255) NOT NULL, \"slug\" character varying(100) NOT NULL, \"description\" text, \"is_active\" boolean NOT NULL DEFAULT true, \"created_at\" TIMESTAMP NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"UQ_b28b07d25e4324eee577de5496d\" UNIQUE (\"slug\"), CONSTRAINT \"PK_d4bc3e82a314fa9e29f652c2c22\" PRIMARY KEY (\"id\"))")];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"organizations\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"name\" character varying(255) NOT NULL, \"subdomain\" character varying(100) NOT NULL, \"description\" text, \"is_active\" boolean NOT NULL DEFAULT true, \"created_at\" TIMESTAMP NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT \"UQ_0660118ba6c48a1781452f75b63\" UNIQUE (\"subdomain\"), CONSTRAINT \"PK_6b031fcd0863e3f6b44230163f9\" PRIMARY KEY (\"id\"))")];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"users\" ADD CONSTRAINT \"FK_109638590074998bb72a2f2cf08\" FOREIGN KEY (\"tenant_id\") REFERENCES \"tenants\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"branding_configs\" ADD CONSTRAINT \"FK_3b0649d78b5c16f8a3d1cd18543\" FOREIGN KEY (\"dispensary_id\") REFERENCES \"dispensaries\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"dispensaries\" ADD CONSTRAINT \"FK_21e35b1fc00894cbc2edc60e435\" FOREIGN KEY (\"company_id\") REFERENCES \"companies\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"companies\" ADD CONSTRAINT \"FK_4a99045ca7335fb66fa4a15f8ae\" FOREIGN KEY (\"organization_id\") REFERENCES \"organizations\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 11:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CreateOrganizationalEntities1770534075418.prototype.down = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("ALTER TABLE \"companies\" DROP CONSTRAINT \"FK_4a99045ca7335fb66fa4a15f8ae\"")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"dispensaries\" DROP CONSTRAINT \"FK_21e35b1fc00894cbc2edc60e435\"")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"branding_configs\" DROP CONSTRAINT \"FK_3b0649d78b5c16f8a3d1cd18543\"")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"users\" DROP CONSTRAINT \"FK_109638590074998bb72a2f2cf08\"")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"organizations\"")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"companies\"")];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"dispensaries\"")];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"branding_configs\"")];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"users\"")];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TYPE \"public\".\"users_role_enum\"")];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"tenants\"")];
                    case 11:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return CreateOrganizationalEntities1770534075418;
}());
exports.CreateOrganizationalEntities1770534075418 = CreateOrganizationalEntities1770534075418;
