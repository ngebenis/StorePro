import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}

export function getTransactionStatusColor(status: string): string {
  switch (status) {
    case "paid":
    case "completed":
      return "bg-green-100 text-green-800";
    case "partial":
      return "bg-yellow-100 text-yellow-800";
    case "pending":
    case "unpaid":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "rejected":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case "sale":
      return "bg-green-100 text-green-800";
    case "purchase":
      return "bg-blue-100 text-blue-800";
    case "return":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function isLowStock(stock: number, threshold: number = 5): boolean {
  return stock <= threshold;
}

export function getStockStatusColor(stock: number): string {
  if (stock <= 3) {
    return "bg-red-100 text-red-800";
  } else if (stock <= 10) {
    return "bg-yellow-100 text-yellow-800";
  } else {
    return "bg-green-100 text-green-800";
  }
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}
