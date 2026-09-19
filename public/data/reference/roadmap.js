/* Lộ trình học năm giai đoạn */

export default [
  {
    id: 'stage1', title: 'Giai đoạn 1 — Nền',
    goal: 'Nắm HTTP và viết được API đầu tiên.',
    project: 'API quản lý danh sách công việc, dữ liệu lưu trong mảng.',
    items: [
      'Hiểu method, status code, header, body',
      'Chạy được một server trả về JSON',
      'Viết đủ 5 route CRUD cho một thực thể',
      'Dùng Postman hoặc Thunder Client để gọi thử',
      'Hiểu async/await, không dùng callback lồng nhau'
    ]
  },
  {
    id: 'stage2', title: 'Giai đoạn 2 — Dữ liệu',
    goal: 'Nối database thật và thiết kế bảng.',
    project: 'API blog — bài viết, tác giả, bình luận, thẻ.',
    items: [
      'Cài PostgreSQL hoặc SQL Server, chạy được query tay',
      'Viết được SELECT, INSERT, UPDATE, DELETE, JOIN',
      'Thiết kế được quan hệ 1–n và n–n',
      'Dùng ORM và chạy migration',
      'Phân trang danh sách'
    ]
  },
  {
    id: 'stage3', title: 'Giai đoạn 3 — Cấu trúc và bảo mật',
    goal: 'Biến bài tập thành phần mềm.',
    project: 'API bán hàng — sản phẩm, giỏ hàng, đơn hàng, phân quyền.',
    items: [
      'Tách Controller – Service – Repository',
      'Dùng DTO, không trả entity ra ngoài',
      'Validate mọi đầu vào ở server',
      'Đăng ký, đăng nhập bằng JWT, hash mật khẩu',
      'Phân quyền theo role và kiểm tra quyền sở hữu',
      'Xử lý lỗi tập trung, định dạng lỗi thống nhất'
    ]
  },
  {
    id: 'stage4', title: 'Giai đoạn 4 — Chất lượng',
    goal: 'Code đáng tin và sửa được.',
    project: 'Bổ sung test và tài liệu cho dự án giai đoạn 3.',
    items: [
      'Viết unit test cho lớp service',
      'Viết integration test cho vài endpoint',
      'Thêm log có cấu trúc và traceId',
      'Sinh tài liệu API bằng Swagger / OpenAPI',
      'Dùng EXPLAIN, thêm index, sửa một truy vấn chậm'
    ]
  },
  {
    id: 'stage5', title: 'Giai đoạn 5 — Đưa lên mạng',
    goal: 'Có một link thật để đưa vào CV.',
    project: 'Deploy dự án giai đoạn 3 kèm CI chạy test.',
    items: [
      'Đóng gói bằng Docker',
      'Chạy ứng dụng + database bằng docker compose',
      'Deploy lên một dịch vụ miễn phí, chạy được HTTPS',
      'Dựng pipeline CI chạy test mỗi lần push',
      'Thêm caching bằng Redis cho một endpoint đọc nhiều'
    ]
  }
];
