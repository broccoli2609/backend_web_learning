/* Phiên bản thư viện — dữ liệu dự phòng khi không đọc được từ nguồn động */

export default {
  updatedAt: '2026-09-18',
  note: 'Dữ liệu ban đầu do Claude tra ngày 18/09/2026. Tác vụ định kỳ hàng tuần sẽ cập nhật lại.',
  items: [
    { id: 'nodejs', name: 'Node.js', eco: 'node', version: '26.9.0', channel: 'LTS sắp tới', note: 'Nhánh 24 đang ở giai đoạn bảo trì (24.21.0); nhánh 22 hỗ trợ bảo mật tới 04/2027.', url: 'https://nodejs.org/en/about/previous-releases' },
    { id: 'express', name: 'Express', eco: 'node', version: '5.2.1', channel: 'Ổn định', note: 'Express 5 tự bắt lỗi từ handler async — khác hẳn Express 4.', url: 'https://expressjs.com/' },
    { id: 'nestjs', name: 'NestJS', eco: 'node', version: '12.0.3', channel: 'Ổn định', note: 'Framework có DI và module sẵn, gần với ASP.NET Core.', url: 'https://docs.nestjs.com/' },
    { id: 'prisma', name: 'Prisma', eco: 'node', version: '8.0.0-rc.15', channel: 'Release candidate', note: 'Tag latest trên npm đang trỏ vào bản RC — dự án thật nên ghim phiên bản ổn định.', url: 'https://www.prisma.io/docs' },
    { id: 'zod', name: 'Zod', eco: 'node', version: '4.6.5', channel: 'Ổn định', note: 'Thư viện validation phổ biến nhất cho TypeScript.', url: 'https://zod.dev/' },
    { id: 'dotnet', name: '.NET', eco: 'dotnet', version: '10.0.12', channel: 'LTS', note: 'Hỗ trợ tới 11/2028. .NET 8 (8.0.31) kết thúc hỗ trợ 11/2026 — nên lên kế hoạch nâng cấp.', url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core' },
    { id: 'aspnetcore', name: 'ASP.NET Core', eco: 'dotnet', version: '10.0.12', channel: 'LTS', note: 'Đi cùng phiên bản .NET, không đánh số riêng.', url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
    { id: 'efcore', name: 'EF Core', eco: 'dotnet', version: '10.0.12', channel: 'LTS', note: 'Nên dùng cùng phiên bản với .NET đang chạy.', url: 'https://learn.microsoft.com/en-us/ef/core/' }
  ]
};
