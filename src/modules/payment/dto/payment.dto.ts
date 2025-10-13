import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const TransactionSchema = z.object({
  id: z.number(), // ID giao dịch trên SePay
  gateway: z.string(), // Brand name của ngân hàng
  transactionDate: z.string().datetime({ offset: false }),  
  accountNumber: z.string(), // Số tài khoản ngân hàng
  code: z.string().nullable(), // Có thể null
  content: z.string(), // Nội dung chuyển khoản
  transferType: z.enum(["in", "out"]), // Chỉ nhận "in" hoặc "out"
  transferAmount: z.number(), // Số tiền giao dịch
  accumulated: z.number(), // Số dư tài khoản
  subAccount: z.string().nullable(), // Có thể null
  referenceCode: z.string(), // Mã tham chiếu
  description: z.string(), // Nội dung sms
});


export class CreatePaymentReceiverDto extends createZodDto(TransactionSchema) {}