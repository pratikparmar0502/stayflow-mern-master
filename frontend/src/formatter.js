/**
 * Formats the hotel price stored in the database.
 *
 * The backend stores the actual price in INR.
 * Example:
 * 1000 -> ₹1,000
 * 2500 -> ₹2,500
 */

// 1. Returns a formatted INR price string.
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "₹ 0";
  }

  const amount = Number(price);

  if (Number.isNaN(amount)) {
    return "₹ 0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// 2. Returns the raw numeric price.
// Useful when calculations are required.
export const getRawPrice = (price) => {
  const amount = Number(price);

  return Number.isNaN(amount) ? 0 : amount;
};
