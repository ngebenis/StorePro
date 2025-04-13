import {
  users,
  type User,
  type InsertUser,
  categories,
  type Category,
  type InsertCategory,
  products,
  type Product,
  type InsertProduct,
  customers,
  type Customer,
  type InsertCustomer,
  vendors,
  type Vendor,
  type InsertVendor,
  purchaseOrders,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  purchaseOrderItems,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  salesOrders,
  type SalesOrder,
  type InsertSalesOrder,
  salesOrderItems,
  type SalesOrderItem,
  type InsertSalesOrderItem,
  productReturns,
  type ProductReturn,
  type InsertProductReturn,
  returnItems,
  type ReturnItem,
  type InsertReturnItem,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte, sql, desc, inArray, lt, gt } from "drizzle-orm";
import { format } from "date-fns";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Explicitly typed for clarity
const PostgresSessionStore = connectPg(session) as any;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, userData: Partial<User>): Promise<User>;
  updateUserLanguage(id: number, language: string): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsWithCategories(): Promise<(Product & { categoryName: string })[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  updateProductStock(id: number, quantityChange: number): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getLowStockProducts(threshold: number): Promise<(Product & { categoryName: string })[]>;
  
  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByCode(code: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  
  // Vendor methods
  getVendors(): Promise<Vendor[]>;
  getVendorById(id: number): Promise<Vendor | undefined>;
  getVendorByCode(code: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<Vendor>): Promise<Vendor>;
  deleteVendor(id: number): Promise<void>;
  
  // Purchase Order methods
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrderDetails(id: number): Promise<(PurchaseOrder & { vendor: Vendor, items: (PurchaseOrderItem & { product: Product })[] }) | undefined>;
  createPurchaseOrder(purchaseOrder: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder>;
  deletePurchaseOrder(id: number): Promise<void>;
  
  // Sales Order methods
  getSalesOrders(): Promise<SalesOrder[]>;
  getSalesOrderDetails(id: number): Promise<(SalesOrder & { customer: Customer, items: (SalesOrderItem & { product: Product })[] }) | undefined>;
  createSalesOrder(salesOrder: InsertSalesOrder, items: InsertSalesOrderItem[]): Promise<SalesOrder>;
  updateSalesOrderStatus(id: number, status: string): Promise<SalesOrder>;
  deleteSalesOrder(id: number): Promise<void>;
  
  // Product Return methods
  getProductReturns(): Promise<ProductReturn[]>;
  getProductReturnDetails(id: number): Promise<(ProductReturn & { customer: Customer, items: (ReturnItem & { product: Product })[] }) | undefined>;
  createProductReturn(productReturn: InsertProductReturn, items: InsertReturnItem[]): Promise<ProductReturn>;
  updateProductReturnStatus(id: number, status: string): Promise<ProductReturn>;
  deleteProductReturn(id: number): Promise<void>;
  
  // Report methods
  getAccountsPayable(startDate?: Date, endDate?: Date): Promise<any[]>;
  getAccountsReceivable(startDate?: Date, endDate?: Date): Promise<any[]>;
  getInventoryReport(): Promise<any[]>;
  getProfitLossReport(month: number, year: number): Promise<any>;
  getMonthlySalesReport(year: number): Promise<any[]>;

  // Dashboard methods
  getDashboardStats(): Promise<any>;
  getRecentTransactions(limit: number): Promise<any[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool,
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserProfile(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLanguage(id: number, language: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ language })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(products.name);
  }

  async getProductsWithCategories(): Promise<(Product & { categoryName: string })[]> {
    const result = await db
      .select({
        ...products,
        categoryName: categories.name
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(products.name);
    
    return result;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.code, code));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, lastUpdated: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async updateProductStock(id: number, quantityChange: number): Promise<Product> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    const newStock = product.stock + quantityChange;
    
    if (newStock < 0) {
      throw new Error("Cannot reduce stock below zero");
    }
    
    const [updatedProduct] = await db
      .update(products)
      .set({ 
        stock: newStock,
        lastUpdated: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(threshold: number): Promise<(Product & { categoryName: string })[]> {
    const result = await db
      .select({
        ...products,
        categoryName: categories.name
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(lt(products.stock, threshold))
      .orderBy(products.stock);
    
    return result;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(customers.name);
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByCode(code: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.code, code));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Vendor methods
  async getVendors(): Promise<Vendor[]> {
    return db.select().from(vendors).orderBy(vendors.name);
  }

  async getVendorById(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async getVendorByCode(code: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.code, code));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: number, vendor: Partial<Vendor>): Promise<Vendor> {
    const [updatedVendor] = await db
      .update(vendors)
      .set(vendor)
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor;
  }

  async deleteVendor(id: number): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // Purchase Order methods
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return db
      .select()
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.date));
  }

  async getPurchaseOrderDetails(id: number): Promise<(PurchaseOrder & { vendor: Vendor, items: (PurchaseOrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
    
    if (!order) return undefined;
    
    const vendor = await this.getVendorById(order.vendorId);
    if (!vendor) throw new Error("Vendor not found");
    
    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id));
    
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProductById(item.productId);
        if (!product) throw new Error(`Product with ID ${item.productId} not found`);
        return { ...item, product };
      })
    );
    
    return {
      ...order,
      vendor,
      items: itemsWithProducts
    };
  }

  async createPurchaseOrder(purchaseOrder: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder> {
    // Generate order number based on date and sequential number
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(
        and(
          gte(purchaseOrders.date, new Date(today.setHours(0, 0, 0, 0))),
          lte(purchaseOrders.date, new Date(today.setHours(23, 59, 59, 999)))
        )
      );
    
    const count = countResult[0]?.count || 0;
    const orderNumber = `PO${dateStr}${(count + 1).toString().padStart(3, '0')}`;
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the purchase order
      const [newOrder] = await tx
        .insert(purchaseOrders)
        .values({ ...purchaseOrder, orderNumber })
        .returning();
      
      // Create the purchase order items
      for (const item of items) {
        await tx
          .insert(purchaseOrderItems)
          .values({ ...item, purchaseOrderId: newOrder.id });
        
        // Update product stock
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            lastUpdated: new Date()
          })
          .where(eq(products.id, item.productId));
      }
      
      return newOrder;
    });
  }

  async updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder> {
    const [updatedOrder] = await db
      .update(purchaseOrders)
      .set({ status: status as any })
      .where(eq(purchaseOrders.id, id))
      .returning();
    
    return updatedOrder;
  }

  async deletePurchaseOrder(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Get items to update stock
      const items = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id));
      
      // Revert stock changes
      for (const item of items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            lastUpdated: new Date()
          })
          .where(eq(products.id, item.productId));
      }
      
      // Delete order items
      await tx
        .delete(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id));
      
      // Delete order
      await tx
        .delete(purchaseOrders)
        .where(eq(purchaseOrders.id, id));
    });
  }

  // Sales Order methods
  async getSalesOrders(): Promise<SalesOrder[]> {
    return db
      .select()
      .from(salesOrders)
      .orderBy(desc(salesOrders.date));
  }

  async getSalesOrderDetails(id: number): Promise<(SalesOrder & { customer: Customer, items: (SalesOrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(salesOrders)
      .where(eq(salesOrders.id, id));
    
    if (!order) return undefined;
    
    const customer = await this.getCustomerById(order.customerId);
    if (!customer) throw new Error("Customer not found");
    
    const items = await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, id));
    
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProductById(item.productId);
        if (!product) throw new Error(`Product with ID ${item.productId} not found`);
        return { ...item, product };
      })
    );
    
    return {
      ...order,
      customer,
      items: itemsWithProducts
    };
  }

  async createSalesOrder(salesOrder: InsertSalesOrder, items: InsertSalesOrderItem[]): Promise<SalesOrder> {
    // Generate order number based on date and sequential number
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(salesOrders)
      .where(
        and(
          gte(salesOrders.date, new Date(today.setHours(0, 0, 0, 0))),
          lte(salesOrders.date, new Date(today.setHours(23, 59, 59, 999)))
        )
      );
    
    const count = countResult[0]?.count || 0;
    const orderNumber = `SO${dateStr}${(count + 1).toString().padStart(3, '0')}`;
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the sales order
      const [newOrder] = await tx
        .insert(salesOrders)
        .values({ ...salesOrder, orderNumber })
        .returning();
      
      // Create the sales order items
      for (const item of items) {
        await tx
          .insert(salesOrderItems)
          .values({ ...item, salesOrderId: newOrder.id });
        
        // Update product stock
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            lastUpdated: new Date()
          })
          .where(eq(products.id, item.productId));
      }
      
      return newOrder;
    });
  }

  async updateSalesOrderStatus(id: number, status: string): Promise<SalesOrder> {
    const [updatedOrder] = await db
      .update(salesOrders)
      .set({ paymentStatus: status as any })
      .where(eq(salesOrders.id, id))
      .returning();
    
    return updatedOrder;
  }

  async deleteSalesOrder(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Get items to update stock
      const items = await tx
        .select()
        .from(salesOrderItems)
        .where(eq(salesOrderItems.salesOrderId, id));
      
      // Revert stock changes
      for (const item of items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            lastUpdated: new Date()
          })
          .where(eq(products.id, item.productId));
      }
      
      // Delete order items
      await tx
        .delete(salesOrderItems)
        .where(eq(salesOrderItems.salesOrderId, id));
      
      // Delete order
      await tx
        .delete(salesOrders)
        .where(eq(salesOrders.id, id));
    });
  }

  // Product Return methods
  async getProductReturns(): Promise<ProductReturn[]> {
    return db
      .select()
      .from(productReturns)
      .orderBy(desc(productReturns.date));
  }

  async getProductReturnDetails(id: number): Promise<(ProductReturn & { customer: Customer, items: (ReturnItem & { product: Product })[] }) | undefined> {
    const [returnRecord] = await db
      .select()
      .from(productReturns)
      .where(eq(productReturns.id, id));
    
    if (!returnRecord) return undefined;
    
    const customer = await this.getCustomerById(returnRecord.customerId);
    if (!customer) throw new Error("Customer not found");
    
    const items = await db
      .select()
      .from(returnItems)
      .where(eq(returnItems.returnId, id));
    
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProductById(item.productId);
        if (!product) throw new Error(`Product with ID ${item.productId} not found`);
        return { ...item, product };
      })
    );
    
    return {
      ...returnRecord,
      customer,
      items: itemsWithProducts
    };
  }

  async createProductReturn(productReturn: InsertProductReturn, items: InsertReturnItem[]): Promise<ProductReturn> {
    // Generate return number based on date and sequential number
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(productReturns)
      .where(
        and(
          gte(productReturns.date, new Date(today.setHours(0, 0, 0, 0))),
          lte(productReturns.date, new Date(today.setHours(23, 59, 59, 999)))
        )
      );
    
    const count = countResult[0]?.count || 0;
    const returnNumber = `RET${dateStr}${(count + 1).toString().padStart(3, '0')}`;
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the product return
      const [newReturn] = await tx
        .insert(productReturns)
        .values({ ...productReturn, returnNumber })
        .returning();
      
      // Create the return items
      for (const item of items) {
        await tx
          .insert(returnItems)
          .values({ ...item, returnId: newReturn.id });
        
        // Update product stock
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            lastUpdated: new Date()
          })
          .where(eq(products.id, item.productId));
      }
      
      return newReturn;
    });
  }

  async updateProductReturnStatus(id: number, status: string): Promise<ProductReturn> {
    const [updatedReturn] = await db
      .update(productReturns)
      .set({ status: status as any })
      .where(eq(productReturns.id, id))
      .returning();
    
    return updatedReturn;
  }

  async deleteProductReturn(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Get items to update stock
      const items = await tx
        .select()
        .from(returnItems)
        .where(eq(returnItems.returnId, id));
      
      // Revert stock changes
      for (const item of items) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            lastUpdated: new Date()
          })
          .where(eq(products.id, item.productId));
      }
      
      // Delete return items
      await tx
        .delete(returnItems)
        .where(eq(returnItems.returnId, id));
      
      // Delete return
      await tx
        .delete(productReturns)
        .where(eq(productReturns.id, id));
    });
  }

  // Report methods
  async getAccountsPayable(startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = db
      .select({
        id: purchaseOrders.id,
        orderNumber: purchaseOrders.orderNumber,
        date: purchaseOrders.date,
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.name,
        totalAmount: purchaseOrders.totalAmount,
        dueDate: purchaseOrders.dueDate,
        status: purchaseOrders.status,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(
        and(
          inArray(
            purchaseOrders.status,
            ["pending", "partial"]
          )
        )
      );

    if (startDate) {
      query = query.where(gte(purchaseOrders.date, startDate));
    }

    if (endDate) {
      query = query.where(lte(purchaseOrders.date, endDate));
    }

    const results = await query.orderBy(purchaseOrders.dueDate);

    // Calculate age of payables
    const today = new Date();
    return results.map(item => {
      let remainingAmount = item.totalAmount;
      if (item.status === 'partial') {
        remainingAmount = item.totalAmount * 0.5; // Assuming 50% paid for partial
      }

      const dueDate = item.dueDate ? new Date(item.dueDate) : today;
      const ageDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        ...item,
        remainingAmount,
        ageDays
      };
    });
  }

  async getAccountsReceivable(startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = db
      .select({
        id: salesOrders.id,
        orderNumber: salesOrders.orderNumber,
        date: salesOrders.date,
        customerId: salesOrders.customerId,
        customerName: customers.name,
        totalAmount: salesOrders.totalAmount,
        dueDate: salesOrders.dueDate,
        status: salesOrders.paymentStatus,
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .where(
        and(
          inArray(
            salesOrders.paymentStatus,
            ["unpaid", "partial"]
          )
        )
      );

    if (startDate) {
      query = query.where(gte(salesOrders.date, startDate));
    }

    if (endDate) {
      query = query.where(lte(salesOrders.date, endDate));
    }

    const results = await query.orderBy(salesOrders.dueDate);

    // Calculate age of receivables
    const today = new Date();
    return results.map(item => {
      let remainingAmount = item.totalAmount;
      if (item.status === 'partial') {
        remainingAmount = item.totalAmount * 0.5; // Assuming 50% paid for partial
      }

      const dueDate = item.dueDate ? new Date(item.dueDate) : today;
      const ageDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        ...item,
        remainingAmount,
        ageDays
      };
    });
  }

  async getInventoryReport(): Promise<any[]> {
    const result = await db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        stock: products.stock,
        costPrice: products.costPrice,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(categories.name, products.name);

    return result.map(item => ({
      ...item,
      totalValue: item.stock * item.costPrice
    }));
  }

  async getProfitLossReport(month: number, year: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Get total sales for the month
    const salesResult = await db
      .select({
        totalSales: sql<number>`SUM(${salesOrders.totalAmount})`
      })
      .from(salesOrders)
      .where(
        and(
          gte(salesOrders.date, startDate),
          lte(salesOrders.date, endDate)
        )
      );
    
    const totalSales = salesResult[0]?.totalSales || 0;
    
    // Get cost of goods sold
    // This is a simplified approach - we get the cost price from products for each sales item
    const salesItems = await db
      .select({
        productId: salesOrderItems.productId,
        quantity: salesOrderItems.quantity,
        price: salesOrderItems.price,
        totalSale: salesOrderItems.total,
      })
      .from(salesOrderItems)
      .innerJoin(
        salesOrders,
        and(
          eq(salesOrderItems.salesOrderId, salesOrders.id),
          gte(salesOrders.date, startDate),
          lte(salesOrders.date, endDate)
        )
      );
    
    let totalCogs = 0;
    let grossProfit = 0;
    
    for (const item of salesItems) {
      const [product] = await db
        .select({
          costPrice: products.costPrice
        })
        .from(products)
        .where(eq(products.id, item.productId));
      
      if (product) {
        const itemCost = product.costPrice * item.quantity;
        totalCogs += itemCost;
      }
    }
    
    grossProfit = totalSales - totalCogs;
    
    // Get returns
    const returnsResult = await db
      .select({
        totalReturns: sql<number>`SUM(${productReturns.totalAmount})`
      })
      .from(productReturns)
      .where(
        and(
          gte(productReturns.date, startDate),
          lte(productReturns.date, endDate)
        )
      );
    
    const totalReturns = returnsResult[0]?.totalReturns || 0;
    
    // Net profit
    const netProfit = grossProfit - totalReturns;
    
    return {
      month,
      year,
      totalSales,
      totalCogs,
      grossProfit,
      totalReturns,
      netProfit
    };
  }

  async getMonthlySalesReport(year: number): Promise<any[]> {
    const monthlySales = [];
    
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      const result = await db
        .select({
          total: sql<number>`SUM(${salesOrders.totalAmount})`
        })
        .from(salesOrders)
        .where(
          and(
            gte(salesOrders.date, startDate),
            lte(salesOrders.date, endDate)
          )
        );
      
      monthlySales.push({
        month,
        total: result[0]?.total || 0
      });
    }
    
    return monthlySales;
  }

  // Dashboard methods
  async getDashboardStats(): Promise<any> {
    // Get the current date and month
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    // Get total monthly sales
    const salesResult = await db
      .select({
        totalSales: sql<number>`SUM(${salesOrders.totalAmount})`
      })
      .from(salesOrders)
      .where(
        and(
          gte(salesOrders.date, firstDayOfMonth),
          lte(salesOrders.date, lastDayOfMonth)
        )
      );
    
    const totalMonthlySales = salesResult[0]?.totalSales || 0;
    
    // Get total accounts payable
    const payablesResult = await db
      .select({
        totalPayables: sql<number>`SUM(
          CASE 
            WHEN ${purchaseOrders.status} = 'pending' THEN ${purchaseOrders.totalAmount}
            WHEN ${purchaseOrders.status} = 'partial' THEN ${purchaseOrders.totalAmount} * 0.5
            ELSE 0
          END
        )`
      })
      .from(purchaseOrders)
      .where(
        inArray(
          purchaseOrders.status,
          ["pending", "partial"]
        )
      );
    
    const totalPayables = payablesResult[0]?.totalPayables || 0;
    
    // Get total accounts receivable
    const receivablesResult = await db
      .select({
        totalReceivables: sql<number>`SUM(
          CASE 
            WHEN ${salesOrders.paymentStatus} = 'unpaid' THEN ${salesOrders.totalAmount}
            WHEN ${salesOrders.paymentStatus} = 'partial' THEN ${salesOrders.totalAmount} * 0.5
            ELSE 0
          END
        )`
      })
      .from(salesOrders)
      .where(
        inArray(
          salesOrders.paymentStatus,
          ["unpaid", "partial"]
        )
      );
    
    const totalReceivables = receivablesResult[0]?.totalReceivables || 0;
    
    // Get profit/loss for current month
    const profitLoss = await this.getProfitLossReport(currentMonth, currentYear);
    
    // Get total inventory
    const inventoryResult = await db
      .select({
        totalItems: sql<number>`COUNT(*)`,
        totalValue: sql<number>`SUM(${products.stock} * ${products.costPrice})`
      })
      .from(products);
    
    const totalInventoryItems = inventoryResult[0]?.totalItems || 0;
    const totalInventoryValue = inventoryResult[0]?.totalValue || 0;
    
    // Get customer count
    const customerResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(customers);
    
    const customerCount = customerResult[0]?.count || 0;
    
    // Get vendor count
    const vendorResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(vendors);
    
    const vendorCount = vendorResult[0]?.count || 0;
    
    // Get previous month data for comparison
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const prevMonthFirstDay = new Date(previousMonthYear, previousMonth - 1, 1);
    const prevMonthLastDay = new Date(previousMonthYear, previousMonth, 0, 23, 59, 59, 999);
    
    // Get previous month sales
    const prevSalesResult = await db
      .select({
        totalSales: sql<number>`SUM(${salesOrders.totalAmount})`
      })
      .from(salesOrders)
      .where(
        and(
          gte(salesOrders.date, prevMonthFirstDay),
          lte(salesOrders.date, prevMonthLastDay)
        )
      );
    
    const prevMonthSales = prevSalesResult[0]?.totalSales || 0;
    
    // Calculate percentage change
    const salesChange = prevMonthSales === 0 
      ? 100 
      : Math.round(((totalMonthlySales - prevMonthSales) / prevMonthSales) * 100);
    
    return {
      totalMonthlySales,
      totalPayables,
      totalReceivables,
      monthlyProfit: profitLoss.netProfit,
      totalInventoryItems,
      totalInventoryValue,
      customerCount,
      vendorCount,
      salesChange
    };
  }

  async getRecentTransactions(limit: number = 5): Promise<any[]> {
    // Get recent sales orders
    const recentSales = await db
      .select({
        id: salesOrders.id,
        transactionId: salesOrders.orderNumber,
        date: salesOrders.date,
        entityName: customers.name,
        type: sql<string>`'sale'`,
        amount: salesOrders.totalAmount,
        status: salesOrders.paymentStatus
      })
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .orderBy(desc(salesOrders.date))
      .limit(limit);
    
    // Get recent purchase orders
    const recentPurchases = await db
      .select({
        id: purchaseOrders.id,
        transactionId: purchaseOrders.orderNumber,
        date: purchaseOrders.date,
        entityName: vendors.name,
        type: sql<string>`'purchase'`,
        amount: purchaseOrders.totalAmount,
        status: purchaseOrders.status
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .orderBy(desc(purchaseOrders.date))
      .limit(limit);
    
    // Get recent returns
    const recentReturns = await db
      .select({
        id: productReturns.id,
        transactionId: productReturns.returnNumber,
        date: productReturns.date,
        entityName: customers.name,
        type: sql<string>`'return'`,
        amount: productReturns.totalAmount,
        status: productReturns.status
      })
      .from(productReturns)
      .leftJoin(customers, eq(productReturns.customerId, customers.id))
      .orderBy(desc(productReturns.date))
      .limit(limit);
    
    // Combine and sort all transactions
    return [...recentSales, ...recentPurchases, ...recentReturns]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
