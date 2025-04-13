import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import nodemailer from "nodemailer";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Setup middleware to check user roles
  const checkRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    return next();
  };

  // Setup email transporter for notifications
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT || "2525"),
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || ""
    }
  });

  // Helper for sending email notifications
  const sendNotification = async (
    type: "sale" | "return" | "low_stock",
    details: any
  ) => {
    try {
      // Get admin users to notify
      const admins = await storage.getAdminUsers();
      if (!admins || admins.length === 0) return;
      
      const recipients = admins.map(admin => admin.email).join(",");
      let subject = "";
      let text = "";
      
      switch (type) {
        case "sale":
          subject = "New Sale Notification";
          text = `A new sale has been recorded with order number ${details.orderNumber} for customer ${details.customerName}. Total amount: ${details.totalAmount}`;
          break;
        case "return":
          subject = "New Return Notification";
          text = `A new return has been recorded with return number ${details.returnNumber} from customer ${details.customerName}. Total amount: ${details.totalAmount}`;
          break;
        case "low_stock":
          subject = "Low Stock Alert";
          text = `Product ${details.name} (Code: ${details.code}) is running low on stock. Current stock: ${details.stock}`;
          break;
      }
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@simplestore.com",
        to: recipients,
        subject,
        text
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  };

  // Helper function to generate PDF
  const generatePDF = async (
    type: "invoice" | "receipt" | "report",
    data: any
  ): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const fontSize = 12;
    
    // Add a title
    page.drawText(data.title, {
      x: 50,
      y: height - 50,
      size: 20,
      font: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    });
    
    // Add company info
    page.drawText("SimpleStore - Inventory Management System", {
      x: 50,
      y: height - 80,
      size: fontSize,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica)
    });
    
    // Add date
    page.drawText(`Date: ${format(new Date(), "yyyy-MM-dd")}`, {
      x: 50,
      y: height - 100,
      size: fontSize,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica)
    });
    
    // Add content based on type
    let y = height - 130;
    
    if (type === "invoice" || type === "receipt") {
      // Add customer/vendor info
      page.drawText(`${data.entityType}: ${data.entityName}`, {
        x: 50,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica)
      });
      y -= 20;
      
      page.drawText(`Document Number: ${data.documentNumber}`, {
        x: 50,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica)
      });
      y -= 20;
      
      page.drawText(`Date: ${data.date}`, {
        x: 50,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica)
      });
      y -= 40;
      
      // Add items table header
      page.drawText("Product", {
        x: 50,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      });
      
      page.drawText("Quantity", {
        x: 250,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      });
      
      page.drawText("Price", {
        x: 350,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      });
      
      page.drawText("Total", {
        x: 450,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      });
      
      y -= 20;
      
      // Add items
      for (const item of data.items) {
        page.drawText(item.productName, {
          x: 50,
          y,
          size: fontSize,
          font: await pdfDoc.embedFont(StandardFonts.Helvetica)
        });
        
        page.drawText(item.quantity.toString(), {
          x: 250,
          y,
          size: fontSize,
          font: await pdfDoc.embedFont(StandardFonts.Helvetica)
        });
        
        page.drawText(item.price.toString(), {
          x: 350,
          y,
          size: fontSize,
          font: await pdfDoc.embedFont(StandardFonts.Helvetica)
        });
        
        page.drawText(item.total.toString(), {
          x: 450,
          y,
          size: fontSize,
          font: await pdfDoc.embedFont(StandardFonts.Helvetica)
        });
        
        y -= 20;
        
        // Add a new page if needed
        if (y < 100) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = newPage.getSize().height - 50;
        }
      }
      
      // Add total
      y -= 20;
      page.drawText("Total Amount:", {
        x: 350,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      });
      
      page.drawText(data.totalAmount.toString(), {
        x: 450,
        y,
        size: fontSize,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      });
      
    } else if (type === "report") {
      // For general reports
      for (const row of data.rows) {
        page.drawText(row, {
          x: 50,
          y,
          size: fontSize,
          font: await pdfDoc.embedFont(StandardFonts.Helvetica)
        });
        
        y -= 20;
        
        // Add a new page if needed
        if (y < 100) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = newPage.getSize().height - 50;
        }
      }
    }
    
    // Add footer
    page.drawText("Thank you for your business!", {
      x: width / 2 - 100,
      y: 50,
      size: fontSize,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica)
    });
    
    return pdfDoc.save();
  };

  // Categories routes
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/categories", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/categories/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/categories/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Products routes
  app.get("/api/products", async (req, res, next) => {
    try {
      const products = await storage.getProductsWithCategories();
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/products/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/products", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/products/:id", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      
      // Check if stock is low and send notification
      if (product.stock < 5) {
        await sendNotification("low_stock", product);
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/products/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/products/low-stock/:threshold", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const threshold = parseInt(req.params.threshold) || 5;
      const products = await storage.getLowStockProducts(threshold);
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  // Customers routes
  app.get("/api/customers", async (req, res, next) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/customers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/customers", checkRole(["admin", "cashier", "owner"]), async (req, res, next) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/customers/:id", checkRole(["admin", "cashier", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/customers/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Vendors routes
  app.get("/api/vendors", async (req, res, next) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/vendors/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendorById(id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vendors", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const vendor = await storage.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/vendors/:id", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.updateVendor(id, req.body);
      res.json(vendor);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/vendors/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVendor(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Purchase Orders routes
  app.get("/api/purchase-orders", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const purchaseOrders = await storage.getPurchaseOrders();
      res.json(purchaseOrders);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/purchase-orders/:id", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const purchaseOrder = await storage.getPurchaseOrderDetails(id);
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(purchaseOrder);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/purchase-orders", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const { purchaseOrder, items } = req.body;
      const createdOrder = await storage.createPurchaseOrder(
        { ...purchaseOrder, createdBy: req.user.id },
        items
      );
      res.status(201).json(createdOrder);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/purchase-orders/:id/status", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const updatedOrder = await storage.updatePurchaseOrderStatus(id, status);
      res.json(updatedOrder);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/purchase-orders/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePurchaseOrder(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Sales Orders routes
  app.get("/api/sales-orders", async (req, res, next) => {
    try {
      const salesOrders = await storage.getSalesOrders();
      res.json(salesOrders);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sales-orders/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.getSalesOrderDetails(id);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      res.json(salesOrder);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sales-orders", checkRole(["admin", "cashier", "owner"]), async (req, res, next) => {
    try {
      const { salesOrder, items } = req.body;
      const createdOrder = await storage.createSalesOrder(
        { ...salesOrder, createdBy: req.user.id },
        items
      );
      
      // Get customer for notification
      const customer = await storage.getCustomerById(salesOrder.customerId);
      if (customer) {
        await sendNotification("sale", {
          orderNumber: createdOrder.orderNumber,
          customerName: customer.name,
          totalAmount: createdOrder.totalAmount
        });
      }
      
      res.status(201).json(createdOrder);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/sales-orders/:id/status", checkRole(["admin", "cashier", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const updatedOrder = await storage.updateSalesOrderStatus(id, status);
      res.json(updatedOrder);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/sales-orders/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSalesOrder(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Product Returns routes
  app.get("/api/returns", checkRole(["admin", "cashier", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const returns = await storage.getProductReturns();
      res.json(returns);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/returns/:id", checkRole(["admin", "cashier", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const productReturn = await storage.getProductReturnDetails(id);
      if (!productReturn) {
        return res.status(404).json({ message: "Return not found" });
      }
      res.json(productReturn);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/returns", checkRole(["admin", "cashier", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const { productReturn, items } = req.body;
      const createdReturn = await storage.createProductReturn(
        { ...productReturn, createdBy: req.user.id },
        items
      );
      
      // Get customer for notification
      const customer = await storage.getCustomerById(productReturn.customerId);
      if (customer) {
        await sendNotification("return", {
          returnNumber: createdReturn.returnNumber,
          customerName: customer.name,
          totalAmount: createdReturn.totalAmount
        });
      }
      
      res.status(201).json(createdReturn);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/returns/:id/status", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const updatedReturn = await storage.updateProductReturnStatus(id, status);
      res.json(updatedReturn);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/returns/:id", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductReturn(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Report routes
  app.get("/api/reports/accounts-payable", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const report = await storage.getAccountsPayable(startDate, endDate);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports/accounts-receivable", checkRole(["admin", "owner", "cashier"]), async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const report = await storage.getAccountsReceivable(startDate, endDate);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports/inventory", checkRole(["admin", "owner", "warehouse"]), async (req, res, next) => {
    try {
      const report = await storage.getInventoryReport();
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports/profit-loss/:month/:year", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      
      const report = await storage.getProfitLossReport(month, year);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports/monthly-sales/:year", checkRole(["admin", "owner", "cashier"]), async (req, res, next) => {
    try {
      const year = parseInt(req.params.year);
      
      const report = await storage.getMonthlySalesReport(year);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res, next) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard/recent-transactions", async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  // PDF export routes
  app.get("/api/export/invoice/:id", checkRole(["admin", "cashier", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.getSalesOrderDetails(id);
      
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      
      const pdfData = {
        title: "INVOICE",
        entityType: "Customer",
        entityName: salesOrder.customer.name,
        documentNumber: salesOrder.orderNumber,
        date: format(new Date(salesOrder.date), "yyyy-MM-dd"),
        items: salesOrder.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        totalAmount: salesOrder.totalAmount
      };
      
      const pdfBytes = await generatePDF("invoice", pdfData);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${salesOrder.orderNumber}.pdf`
      );
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/export/purchase-order/:id", checkRole(["admin", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const purchaseOrder = await storage.getPurchaseOrderDetails(id);
      
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      const pdfData = {
        title: "PURCHASE ORDER",
        entityType: "Vendor",
        entityName: purchaseOrder.vendor.name,
        documentNumber: purchaseOrder.orderNumber,
        date: format(new Date(purchaseOrder.date), "yyyy-MM-dd"),
        items: purchaseOrder.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        totalAmount: purchaseOrder.totalAmount
      };
      
      const pdfBytes = await generatePDF("invoice", pdfData);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=po-${purchaseOrder.orderNumber}.pdf`
      );
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/export/return/:id", checkRole(["admin", "cashier", "warehouse", "owner"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const productReturn = await storage.getProductReturnDetails(id);
      
      if (!productReturn) {
        return res.status(404).json({ message: "Return not found" });
      }
      
      const pdfData = {
        title: "RETURN RECEIPT",
        entityType: "Customer",
        entityName: productReturn.customer.name,
        documentNumber: productReturn.returnNumber,
        date: format(new Date(productReturn.date), "yyyy-MM-dd"),
        items: productReturn.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        totalAmount: productReturn.totalAmount
      };
      
      const pdfBytes = await generatePDF("receipt", pdfData);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=return-${productReturn.returnNumber}.pdf`
      );
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/export/report/:type", checkRole(["admin", "owner"]), async (req, res, next) => {
    try {
      const { type } = req.params;
      let reportData;
      let title;
      let rows = [];
      
      switch (type) {
        case "inventory":
          reportData = await storage.getInventoryReport();
          title = "INVENTORY REPORT";
          rows = [
            "Product Code | Product Name | Category | Stock | Cost Price | Total Value",
            "-------------------------------------------------------------------",
            ...reportData.map(item => 
              `${item.code} | ${item.name} | ${item.categoryName} | ${item.stock} | ${item.costPrice} | ${item.totalValue}`
            )
          ];
          break;
          
        case "accounts-payable":
          reportData = await storage.getAccountsPayable();
          title = "ACCOUNTS PAYABLE REPORT";
          rows = [
            "Order Number | Date | Vendor | Total Amount | Due Date | Status | Remaining | Age (days)",
            "-------------------------------------------------------------------------------",
            ...reportData.map(item => 
              `${item.orderNumber} | ${format(new Date(item.date), "yyyy-MM-dd")} | ${item.vendorName} | ${item.totalAmount} | ${item.dueDate ? format(new Date(item.dueDate), "yyyy-MM-dd") : 'N/A'} | ${item.status} | ${item.remainingAmount} | ${item.ageDays}`
            )
          ];
          break;
          
        case "accounts-receivable":
          reportData = await storage.getAccountsReceivable();
          title = "ACCOUNTS RECEIVABLE REPORT";
          rows = [
            "Order Number | Date | Customer | Total Amount | Due Date | Status | Remaining | Age (days)",
            "-------------------------------------------------------------------------------",
            ...reportData.map(item => 
              `${item.orderNumber} | ${format(new Date(item.date), "yyyy-MM-dd")} | ${item.customerName} | ${item.totalAmount} | ${item.dueDate ? format(new Date(item.dueDate), "yyyy-MM-dd") : 'N/A'} | ${item.status} | ${item.remainingAmount} | ${item.ageDays}`
            )
          ];
          break;
          
        default:
          return res.status(400).json({ message: "Invalid report type" });
      }
      
      const pdfData = {
        title,
        rows
      };
      
      const pdfBytes = await generatePDF("report", pdfData);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${type}-report.pdf`
      );
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
