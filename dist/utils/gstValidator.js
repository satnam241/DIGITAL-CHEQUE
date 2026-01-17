"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGSTNumber = validateGSTNumber;
// utils/gstValidator.ts
function validateGSTNumber(gstNumber, state) {
    // Basic GST regex (15 characters alphanumeric)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
        return {
            isValid: false,
            message: "Invalid GST number format"
        };
    }
    // Optional: state code check (first 2 digits)
    if (state && !gstNumber.startsWith(state)) {
        return {
            isValid: false,
            message: `GST number does not match the state code ${state}`
        };
    }
    return {
        isValid: true,
        message: "Valid GST number"
    };
}
