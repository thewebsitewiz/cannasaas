"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerConfig = void 0;
// cannasaas-api/src/common/logger/winston.config.ts
var nest_winston_1 = require("nest-winston");
var winston = require("winston");
exports.loggerConfig = nest_winston_1.WinstonModule.forRoot({
    transports: __spreadArray([
        new winston.transports.Console({
            format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), process.env.NODE_ENV === 'production'
                ? winston.format.json()
                : nest_winston_1.utilities.format.nestLike('CannaSaas', {
                    prettyPrint: true, colors: true
                })),
        })
    ], (process.env.NODE_ENV === 'production' ? [
        new winston.transports.File({
            filename: 'logs/error.log', level: 'error',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            maxsize: 10 * 1024 * 1024, maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            maxsize: 50 * 1024 * 1024, maxFiles: 10,
        }),
    ] : []), true),
});
