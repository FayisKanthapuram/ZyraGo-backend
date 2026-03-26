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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const common_1 = require("@nestjs/common");
const booking_service_1 = require("./booking.service");
const driver_service_1 = require("../driver/driver.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BookingController = class BookingController {
    bookingService;
    driverService;
    constructor(bookingService, driverService) {
        this.bookingService = bookingService;
        this.driverService = driverService;
    }
    async create(bookingData, req) {
        return this.bookingService.create({
            ...bookingData,
            user: req.user.userId,
            status: 'requested',
        });
    }
    async match(id) {
        const availableDrivers = await this.driverService.findAvailableDrivers();
        if (availableDrivers.length === 0) {
            throw new common_1.NotFoundException('No available drivers found');
        }
        const booking = await this.bookingService.matchDriver(id, availableDrivers);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found or already assigned');
        }
        await this.driverService.updateStatus(booking.driver.toString(), 'busy');
        return booking;
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/match'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "match", null);
exports.BookingController = BookingController = __decorate([
    (0, common_1.Controller)('booking'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [booking_service_1.BookingService,
        driver_service_1.DriverService])
], BookingController);
//# sourceMappingURL=booking.controller.js.map