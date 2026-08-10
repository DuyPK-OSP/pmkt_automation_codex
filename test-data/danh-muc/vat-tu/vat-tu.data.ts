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
