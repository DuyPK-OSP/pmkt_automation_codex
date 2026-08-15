import { TestDataGenerator } from '@utils/test-data';
import type {
  CatalogueOption,
  FullGoodsMaterialInput,
  FullServiceMaterialInput,
  MaterialType,
} from '@pages/danh-muc/vat-tu.page';

export interface MaterialDetailEditData {
  readonly code: string;
  readonly originalName: string;
  readonly updatedName: string;
  readonly cancelledDescription: string;
}

export interface MaterialDetailCreationData {
  readonly code: string;
  readonly name: string;
}

/** Sinh dữ liệu Vật tư riêng cho testcase thao tác xóa, không dùng dữ liệu nền. */
export function materialDetailCreationData(testCaseId: string): MaterialDetailCreationData {
  const generator = new TestDataGenerator();
  return {
    code: generator.uniqueCode(testCaseId),
    name: generator.uniqueKeyword(testCaseId),
  };
}

/** Sinh dữ liệu đầy đủ cho testcase Chi tiết của loại Vật tư có quản lý kho. */
export function materialDetailFullInventoryData(
  testCaseId: string,
  materialType: Exclude<MaterialType, 'Dịch vụ'>,
  group: CatalogueOption,
  mainUnit: CatalogueOption,
): FullGoodsMaterialInput {
  const code = new TestDataGenerator().uniqueCode(testCaseId);
  return {
    code,
    name: `${materialType} ${testCaseId} ${code}`,
    description: `Mô tả ${testCaseId} ${code}`,
    purchaseName: `Tên mua ${testCaseId} ${code}`,
    saleName: `Tên bán ${testCaseId} ${code}`,
    imagePath: 'test-data/danh-muc/vat-tu/tc32-material.png',
    group,
    mainUnit,
  };
}

/** Sinh dữ liệu đầy đủ cho testcase Chi tiết Dịch vụ. */
export function materialDetailFullServiceData(
  testCaseId: string,
  group: CatalogueOption,
  mainUnit: CatalogueOption,
): FullServiceMaterialInput {
  const code = new TestDataGenerator().uniqueCode(testCaseId);
  return {
    code,
    name: `Dịch vụ ${testCaseId} ${code}`,
    description: `Mô tả ${testCaseId} ${code}`,
    purchaseName: `Tên mua ${testCaseId} ${code}`,
    saleName: `Tên bán ${testCaseId} ${code}`,
    group,
    mainUnit,
  };
}

/** Sinh bộ dữ liệu unique, traceable cho luồng Chỉnh sửa rồi Hủy tại màn Chi tiết Vật tư. */
export function materialDetailEditData(testCaseId: string): MaterialDetailEditData {
  const generator = new TestDataGenerator();
  return {
    code: generator.uniqueCode(testCaseId),
    originalName: generator.uniqueKeyword(`${testCaseId}-original`),
    updatedName: generator.uniqueKeyword(`${testCaseId}-updated`),
    cancelledDescription: generator.uniqueKeyword(`${testCaseId}-cancel`),
  };
}

export const expectedMaterialTypeCards = [
  {
    type: 'Hàng hóa',
    description: 'Sản phẩm bạn mua và bán lại cho khách hàng',
  },
  {
    type: 'Dịch vụ',
    description: 'Dịch vụ mà bạn cung cấp cho khách hàng',
  },
  {
    type: 'Nguyên vật liệu',
    description: 'Nguyên liệu đầu vào dùng cho hoạt động sản xuất, xây dựng, cung cấp dịch vụ',
  },
  {
    type: 'Công cụ, dụng cụ',
    description: 'Công cụ, dụng cụ mua về nhập kho chưa đưa vào sử dụng',
  },
  {
    type: 'Thành phẩm',
    description: 'Là sản phẩm đầu ra của quá trình sản xuất',
  },
  {
    type: 'Bán thành phẩm',
    description: 'Sản phẩm đầu ra của một công đoạn sản xuất nhất định',
  },
] as const;

export const materialFormProfiles = {
  'Hàng hóa': {
    hasSpecialGoodsType: true,
    hasWarrantyAndImage: true,
    hasInventoryTab: true,
    hasConversionTab: true,
    hasAlternativeUnitTab: false,
  },
  'Dịch vụ': {
    hasSpecialGoodsType: false,
    hasWarrantyAndImage: false,
    hasInventoryTab: false,
    hasConversionTab: false,
    hasAlternativeUnitTab: true,
  },
  'Nguyên vật liệu': {
    hasSpecialGoodsType: false,
    hasWarrantyAndImage: true,
    hasInventoryTab: true,
    hasConversionTab: true,
    hasAlternativeUnitTab: false,
  },
  'Công cụ, dụng cụ': {
    hasSpecialGoodsType: false,
    hasWarrantyAndImage: true,
    hasInventoryTab: true,
    hasConversionTab: true,
    hasAlternativeUnitTab: false,
  },
  'Thành phẩm': {
    hasSpecialGoodsType: false,
    hasWarrantyAndImage: true,
    hasInventoryTab: true,
    hasConversionTab: true,
    hasAlternativeUnitTab: false,
  },
  'Bán thành phẩm': {
    hasSpecialGoodsType: false,
    hasWarrantyAndImage: true,
    hasInventoryTab: true,
    hasConversionTab: true,
    hasAlternativeUnitTab: false,
  },
} as const;
