import { TestDataGenerator } from '@utils/test-data';

const generator = new TestDataGenerator();

export interface PurchaseDocumentData {
  readonly supplierCode: string;
  readonly documentNumber: string;
  readonly paymentDocumentNumber?: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly lot: string;
  readonly expiry: string;
}

export function purchaseDocumentData(testCaseId: number, immediatePayment = false): PurchaseDocumentData {
  return {
    supplierCode: 'KOP_OSP_NCC_CN',
    documentNumber: generator.uniqueCode(`CTMH_TC${testCaseId}`),
    ...(immediatePayment ? { paymentDocumentNumber: generator.uniqueCode(`CTTT_TC${testCaseId}`) } : {}),
    quantity: String(5 + Math.floor(Math.random() * 16)),
    unitPrice: String(50_000 + Math.floor(Math.random() * 10) * 10_000),
    lot: generator.uniqueCode(`LO_TC${testCaseId}`).slice(0, 30),
    expiry: '31/12/2027',
  };
}
