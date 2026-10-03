const { execSync } = require('child_process');

// Wait! It's a Spring Boot app.
// If it returns 7.6 instead of 7600, then fromInGrams or toInGrams MUST BE NULL!
// Why would getWeightInGrams("Kg") be NULL in the actual app but NOT in my TestConverter.java?
