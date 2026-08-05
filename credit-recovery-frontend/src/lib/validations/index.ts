import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .refine((v) => v.trim() === v, "Password must not start/end with whitespace")
  .refine(
    (v) => v !== v.toLowerCase() && v !== v.toUpperCase() && /\d/.test(v),
    "Use upper and lower case letters and at least one digit"
  )

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export const signupSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required").max(255),
  email: z.email("Enter a valid email"),
  password: passwordSchema,
})

export const businessSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(255),
  address: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  whatsapp_number: z.string().max(20).optional().nullable(),
  currency: z.string().min(1).max(10),
  payment_instructions: z.string().optional().nullable(),
})

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  mobile_number: z
    .string()
    .trim()
    .min(1, "Mobile is required")
    .refine((v) => (v.match(/\d/g) || []).length >= 7, "Mobile number does not look valid"),
  business_name: z.string().max(255).optional().nullable(),
  whatsapp_number: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  credit_limit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  opening_balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  credit_status: z.enum(["active", "restricted", "blocked"]),
})

export const creditSaleSchema = z.object({
  customer_id: z.string().uuid("Select a retailer"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  invoice_number: z.string().trim().min(1, "Invoice number is required").max(100),
  invoice_date: z.string().min(1, "Invoice date is required"),
  description: z.string().optional().nullable(),
  override_credit_limit: z.boolean(),
})

export const paymentSchema = z.object({
  customer_id: z.string().uuid("Select a retailer"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.string().min(1, "Payment method is required").max(50),
  reference_number: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
})

export const adjustmentSchema = z.object({
  customer_id: z.string().uuid("Select a retailer"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  direction: z.enum(["increase", "decrease"]),
  description: z.string().trim().min(1, "Description is required"),
  reference_number: z.string().max(100).optional().nullable(),
})

export const reversalSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required"),
})
