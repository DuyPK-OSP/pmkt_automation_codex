import { test, expect } from '@fixtures/database.fixture';

const EXPECTED_INDUSTRY = Object.freeze({
  tenantId: '26a1b920-a3c4-4a1d-bb24-179527ceafcd',
  code: 'KOP_OSP',
  name: 'Tập đoàn số',
  description: 'Ngành nghề về công nghệ thông tin',
  creatorId: '3f3bfc4b-fb0f-4cef-84be-a29a43768c12',
});

test.describe('DB - Danh mục Ngành nghề', () => {
  test('kiểm tra bản ghi KOP_OSP đã được lưu đúng trong mst_nganh_nghe', async ({ db }) => {
    const record = await db.nganhNghe.findByCode(
      EXPECTED_INDUSTRY.tenantId,
      EXPECTED_INDUSTRY.code,
    );

    expect(record, 'DB phải tồn tại bản ghi Ngành nghề KOP_OSP đúng tenant').not.toBeNull();
    expect(record).toMatchObject({
      tenantId: EXPECTED_INDUSTRY.tenantId,
      ma: EXPECTED_INDUSTRY.code,
      ten: EXPECTED_INDUSTRY.name,
      moTa: EXPECTED_INDUSTRY.description,
      trangThai: true,
      daXoa: false,
      nguoiTao: EXPECTED_INDUSTRY.creatorId,
      nguoiCapNhat: EXPECTED_INDUSTRY.creatorId,
      phienBan: 1,
    });
    expect(record?.id, 'ID bản ghi phải là UUID').toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(record?.ngayTao, 'Ngày tạo phải được lưu').toBeInstanceOf(Date);
    expect(record?.ngayCapNhat, 'Ngày cập nhật phải được lưu').toBeInstanceOf(Date);
  });
});
