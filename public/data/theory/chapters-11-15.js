/* Lý thuyết — chương 11 đến 15 */

export default [
{
  id: 'c11', num: 11, title: 'Node.js và Express',
  summary: 'Event loop, middleware pipeline, routing, cấu trúc project, package hay dùng.',
  lessons: [
    {
      id: 'c11l1', title: 'Event loop — điều phải hiểu trước tiên',
      body: `
<p>Node chạy JavaScript trên <strong>một luồng duy nhất</strong>. Khi gặp thao tác I/O (đọc file, gọi database), nó giao việc ra ngoài và tiếp tục phục vụ request khác, khi xong mới quay lại xử lý kết quả.</p>
<p>Hệ quả trực tiếp và rất thực tế: mọi tính toán nặng <em>đồng bộ</em> sẽ chặn toàn bộ server. Không phải chậm một request — là không request nào được phục vụ trong khoảng đó.</p>
<pre><code>// Đúng: nhường luồng trong lúc chờ
const user = await db.user.findUnique({ where: { id } });

// Sai: chặn mọi request khác
const data = fs.readFileSync('big.json');</code></pre>
<p>Cách xử lý việc nặng: đẩy sang <code>worker_threads</code>, sang hàng đợi, hoặc chia nhỏ để nhường luồng giữa chừng.</p>
<p class="callout">Một nhầm lẫn phổ biến: <code>async</code> không làm code chạy song song. Nó chỉ cho phép <em>chờ</em> mà không chặn. Một vòng lặp tính toán trong hàm <code>async</code> vẫn chặn y như thường.</p>`,
      check: { type: 'quiz', q: 'Endpoint gọi hàm tính hash 2 triệu vòng lặp đồng bộ. Điều gì xảy ra với các request khác?',
        options: ['Chúng chạy song song bình thường', 'Chúng phải chờ tới khi vòng lặp kết thúc', 'Node tự tạo thêm luồng để xử lý', 'Chỉ request cùng route mới bị ảnh hưởng'],
        answer: 1,
        explain: 'Một luồng, một hàng đợi. Tính toán đồng bộ giữ luồng đó cho tới khi xong, nên mọi request khác — kể cả /health — đều phải xếp hàng.' }
    },
    {
      id: 'c11l2', title: 'Middleware pipeline',
      body: `
<p>Mỗi request đi qua một dãy hàm theo đúng thứ tự khai báo. Mỗi hàm hoặc trả response, hoặc gọi <code>next()</code> để chuyển tiếp.</p>
<pre><code>const app = express();

app.use(express.json());              // parse JSON body
app.use(cors());                      // CORS
app.use(morgan('dev'));               // log
app.use('/api/orders', ordersRouter); // route
app.use(errorHandler);                // bắt lỗi, LUÔN đặt cuối

app.listen(3000);</code></pre>
<p>Thứ tự quyết định hành vi. Đặt <code>express.json()</code> sau router thì <code>req.body</code> luôn <code>undefined</code>. Đặt <code>errorHandler</code> trước router thì nó không bao giờ bắt được lỗi.</p>
<p>Middleware xử lý lỗi nhận <strong>bốn</strong> tham số — thiếu một là Express không nhận ra nó và coi như middleware thường:</p>
<pre><code>function errorHandler(err, req, res, next) { /* ... */ }</code></pre>`,
      check: { type: 'ex', exId: 'node-07' }
    },
    {
      id: 'c11l3', title: 'Một route CRUD đầy đủ',
      body: `
<pre><code>import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) =&gt; {
  const { page = 1, size = 20 } = req.query;
  res.json(await orderService.list({ page: +page, size: +size }));
});

router.get('/:id', async (req, res) =&gt; {
  const order = await orderService.getById(+req.params.id);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json(order);
});

router.post('/', requireAuth, async (req, res, next) =&gt; {
  try {
    const dto = CreateOrder.parse(req.body);
    const created = await orderService.create(req.user.id, dto);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

export default router;</code></pre>
<p>Ba chi tiết đáng chú ý: ép kiểu cho tham số từ query và params; trả <code>201</code> chứ không phải <code>200</code> khi tạo mới; và <code>next(err)</code> để lỗi chảy về middleware xử lý lỗi thay vì lặp lại try/catch ở mọi nơi.</p>
<p class="callout">Express 5 tự động bắt lỗi từ handler async, nên <code>try/catch</code> trở thành tuỳ chọn. Ở Express 4 thì không — quên là request treo vĩnh viễn.</p>`,
      check: { type: 'ex', exId: 'node-04' }
    },
    {
      id: 'c11l4', title: 'Cấu trúc project và package',
      body: `
<p>Chia theo <strong>tính năng</strong> dễ mở rộng hơn chia theo loại file:</p>
<pre><code>src/
  modules/
    orders/
      orders.controller.js
      orders.service.js
      orders.repository.js
      orders.schema.js
    products/
  common/
    middleware/
    errors/
  config/</code></pre>
<table><thead><tr><th>Nhu cầu</th><th>Package</th></tr></thead><tbody>
<tr><td>Web framework</td><td>express, fastify</td></tr>
<tr><td>ORM</td><td>@prisma/client, sequelize</td></tr>
<tr><td>Validation</td><td>zod, joi</td></tr>
<tr><td>Auth</td><td>jsonwebtoken, bcrypt</td></tr>
<tr><td>Log</td><td>pino, winston</td></tr>
<tr><td>Test</td><td>vitest/jest, supertest</td></tr>
<tr><td>Bảo mật HTTP</td><td>helmet, cors, express-rate-limit</td></tr>
</tbody></table>
<p><strong>NestJS</strong> dựng trên Express, mang sẵn module, dependency injection và decorator — rất gần với ASP.NET Core. Nhưng nên viết Express thuần trước để hiểu điều Nest đang làm giúp.</p>`,
      check: { type: 'ex', exId: 'node-23' }
    }
  ]
},
{
  id: 'c12', num: 12, title: 'ASP.NET Core Web API',
  summary: 'Program.cs, service lifetime, controller, minimal API, EF Core.',
  lessons: [
    {
      id: 'c12l1', title: 'Program.cs — nơi mọi thứ bắt đầu',
      body: `
<pre><code>var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext&lt;AppDbContext&gt;(o =&gt;
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped&lt;IOrderService, OrderService&gt;();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();   // bạn là ai
app.UseAuthorization();    // bạn được làm gì
app.MapControllers();

app.Run();</code></pre>
<p>File này có hai nửa rõ rệt: trước <code>builder.Build()</code> là <em>đăng ký dịch vụ</em>, sau đó là <em>xếp middleware</em>. Nhầm nửa là lỗi biên dịch hoặc lỗi thời gian chạy ngay lập tức.</p>
<p>Thứ tự middleware quan trọng như ở Express. <code>UseAuthentication</code> luôn đứng trước <code>UseAuthorization</code>; <code>UseCors</code> phải đứng trước cả hai; <code>UseExceptionHandler</code> đứng đầu để bắt được lỗi của mọi lớp bên dưới.</p>`,
      check: { type: 'quiz', q: 'Endpoint có [Authorize] luôn trả 401 dù token hợp lệ. Nguyên nhân phổ biến nhất?',
        options: ['Thiếu AddControllers()', 'UseAuthorization() đặt trước UseAuthentication()', 'Thiếu UseHttpsRedirection()', 'Controller thiếu [ApiController]'],
        answer: 1,
        explain: 'Authorization chạy trước khi authentication kịp dựng danh tính, nên nó thấy một người dùng ẩn danh. Đây là lỗi kinh điển vì code vẫn biên dịch và chạy bình thường.' }
    },
    {
      id: 'c12l2', title: 'Service lifetime',
      body: `
<table><thead><tr><th>Lifetime</th><th>Vòng đời</th><th>Dùng cho</th></tr></thead><tbody>
<tr><td><code>Transient</code></td><td>Mỗi lần yêu cầu một instance mới</td><td>Dịch vụ nhẹ, không trạng thái</td></tr>
<tr><td><code>Scoped</code></td><td>Một instance cho mỗi request</td><td>Service, repository, DbContext</td></tr>
<tr><td><code>Singleton</code></td><td>Một instance cho cả ứng dụng</td><td>Cấu hình, cache in-memory</td></tr>
</tbody></table>
<p>Quy tắc an toàn: mặc định chọn <code>Scoped</code> cho mọi thứ chạm tới database. <code>Singleton</code> chỉ dành cho thứ không giữ trạng thái theo người dùng.</p>
<p>Tiêm <code>Scoped</code> vào <code>Singleton</code> là lỗi thời gian chạy — .NET phát hiện và ném exception khi khởi động nếu bạn bật validation scope (mặc định bật ở môi trường Development). Đừng tắt nó đi để "cho chạy được".</p>`,
      check: { type: 'ex', exId: 'net-05' }
    },
    {
      id: 'c12l3', title: 'Controller và model binding',
      body: `
<pre><code>[ApiController]
[Route("api/[controller]")]
public class OrdersController(IOrderService service) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task&lt;ActionResult&lt;OrderDto&gt;&gt; GetById(int id)
    {
        var order = await service.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPost]
    [Authorize]
    public async Task&lt;ActionResult&lt;OrderDto&gt;&gt; Create(CreateOrderDto dto)
    {
        var created = await service.CreateAsync(User.GetUserId(), dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}</code></pre>
<p><code>[ApiController]</code> mang lại ba thứ miễn phí: tự động trả <code>400</code> kèm chi tiết khi model không hợp lệ (không cần <code>if (!ModelState.IsValid)</code>), suy luận nguồn tham số, và yêu cầu route rõ ràng.</p>
<p><code>CreatedAtAction</code> trả <code>201</code> kèm header <code>Location</code> trỏ tới tài nguyên vừa tạo — đúng chuẩn REST và giúp client không phải đoán URL.</p>
<p>Ràng buộc kiểu trong route (<code>{id:int}</code>) khiến <code>/api/orders/abc</code> trả 404 ngay ở tầng routing, không vào tới controller.</p>`,
      check: { type: 'ex', exId: 'net-02' }
    },
    {
      id: 'c12l4', title: 'Minimal API',
      body: `
<p>Với API nhỏ, có thể bỏ controller hoàn toàn:</p>
<pre><code>var orders = app.MapGroup("/api/orders").RequireAuthorization();

orders.MapGet("/{id:int}", async (int id, IOrderService svc) =&gt;
    await svc.GetByIdAsync(id) is { } o ? Results.Ok(o) : Results.NotFound());

orders.MapPost("/", async (CreateOrderDto dto, IOrderService svc) =&gt;
{
    var created = await svc.CreateAsync(dto);
    return Results.Created($"/api/orders/{created.Id}", created);
});</code></pre>
<p>Tham số được lấy tự động: <code>int id</code> từ route, <code>CreateOrderDto</code> từ body, <code>IOrderService</code> từ DI container. Không cần thuộc tính nào cho trường hợp thông thường.</p>
<p>Controller hợp với dự án lớn nhiều quy ước; Minimal API hợp với dịch vụ nhỏ và microservice. Cả hai đều chính thống, không có cái nào "cũ" hơn cái nào.</p>`,
      check: { type: 'ex', exId: 'net-16' }
    },
    {
      id: 'c12l5', title: 'EF Core',
      body: `
<pre><code>public class AppDbContext(DbContextOptions&lt;AppDbContext&gt; options) : DbContext(options)
{
    public DbSet&lt;Order&gt; Orders =&gt; Set&lt;Order&gt;();
    public DbSet&lt;Product&gt; Products =&gt; Set&lt;Product&gt;();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity&lt;Order&gt;()
            .HasMany(o =&gt; o.Items)
            .WithOne(i =&gt; i.Order)
            .HasForeignKey(i =&gt; i.OrderId);
    }
}</code></pre>
<pre><code>dotnet ef migrations add AddOrderTable
dotnet ef database update</code></pre>
<p>Hai mẹo hiệu năng dùng được ngay:</p>
<ul>
<li><code>AsNoTracking()</code> cho truy vấn chỉ đọc — EF không phải theo dõi thay đổi, nhanh hơn đáng kể trên danh sách lớn.</li>
<li><code>Include()</code> hoặc <code>Select()</code> chiếu thẳng sang DTO để tránh N+1.</li>
</ul>
<pre><code>var orders = await db.Orders
    .AsNoTracking()
    .Where(o =&gt; o.CustomerId == id)
    .Select(o =&gt; new OrderDto(o.Id, o.Total, o.CreatedAt))
    .ToListAsync();</code></pre>
<p>Chiếu sang DTO ngay trong truy vấn là cách tốt nhất: EF chỉ SELECT đúng những cột đó, và bạn không bao giờ lỡ tay trả entity ra ngoài.</p>`,
      check: { type: 'ex', exId: 'net-09' }
    }
  ]
},
{
  id: 'c13', num: 13, title: 'So sánh hai nền tảng',
  summary: 'Node.js và ASP.NET Core khác nhau ở đâu, chọn cái nào, bảng đối chiếu khái niệm.',
  lessons: [
    {
      id: 'c13l1', title: 'Khác biệt cốt lõi',
      body: `
<table><thead><tr><th>Tiêu chí</th><th>Node.js / Express</th><th>ASP.NET Core</th></tr></thead><tbody>
<tr><td>Ngôn ngữ</td><td>JavaScript / TypeScript</td><td>C#</td></tr>
<tr><td>Kiểu dữ liệu</td><td>Động (TypeScript thêm tĩnh)</td><td>Tĩnh, biên dịch kiểm tra chặt</td></tr>
<tr><td>Mô hình xử lý</td><td>Một luồng + event loop</td><td>Nhiều luồng + async/await</td></tr>
<tr><td>Hiệu năng</td><td>Tốt cho I/O, yếu khi tính toán nặng</td><td>Mạnh ở cả hai</td></tr>
<tr><td>Cấu trúc</td><td>Tự do, bạn tự quyết định</td><td>Có quy ước rõ, DI sẵn</td></tr>
<tr><td>Hệ sinh thái</td><td>npm khổng lồ, chất lượng không đều</td><td>NuGet + thư viện chính thức đầy đủ</td></tr>
<tr><td>Thị trường VN</td><td>Startup, sản phẩm, fullstack JS</td><td>Doanh nghiệp, ngân hàng, outsourcing</td></tr>
</tbody></table>
<p>Điểm quan trọng nhất cho người học: các khái niệm nền ở chương 1–10 chuyển qua lại gần như nguyên vẹn. Học sâu một cái, cái thứ hai sẽ nhanh hơn nhiều lần.</p>`,
      check: { type: 'quiz', q: 'Dịch vụ cần xử lý ảnh nặng cho hàng nghìn request mỗi phút. Nhận định nào đúng nhất?',
        options: ['Node.js phù hợp hơn vì nhanh hơn ở mọi tác vụ', 'ASP.NET Core có lợi thế nhờ mô hình đa luồng; nếu chọn Node thì phải đẩy việc nặng sang worker hoặc hàng đợi', 'Cả hai đều không làm được', 'Chỉ cần thêm async/await là Node xử lý song song được'],
        answer: 1,
        explain: 'Tính toán nặng là điểm yếu của mô hình một luồng. Node vẫn làm được nhưng phải tách việc ra khỏi luồng chính; .NET xử lý tự nhiên hơn nhờ thread pool.' }
    },
    {
      id: 'c13l2', title: 'Bảng đối chiếu khái niệm',
      body: `
<table><thead><tr><th>Node.js / Express</th><th>ASP.NET Core</th></tr></thead><tbody>
<tr><td><code>app.use(...)</code></td><td><code>app.UseXxx(...)</code></td></tr>
<tr><td>Router</td><td>Controller hoặc <code>MapGet</code></td></tr>
<tr><td><code>req.body</code></td><td>Tham số được model binding</td></tr>
<tr><td>Zod / Joi</td><td>Data Annotations, FluentValidation</td></tr>
<tr><td>Prisma / Sequelize</td><td>EF Core</td></tr>
<tr><td><code>jsonwebtoken</code></td><td><code>AddJwtBearer</code></td></tr>
<tr><td><code>.env</code></td><td><code>appsettings.json</code></td></tr>
<tr><td>Truyền tham số thủ công</td><td>DI container sẵn</td></tr>
<tr><td>Jest + Supertest</td><td>xUnit + WebApplicationFactory</td></tr>
<tr><td>BullMQ</td><td>Hangfire / <code>BackgroundService</code></td></tr>
</tbody></table>
<p>Cách dùng bảng này: khi đã biết một cột, học cột kia bằng cách tra từng dòng thay vì đọc lại từ đầu. Khái niệm giống nhau, chỉ đổi cú pháp và tên gọi.</p>`,
      check: { type: 'quiz', q: 'Bạn biết Express và đang học ASP.NET Core. Thứ gì ở .NET không có tương đương trực tiếp trong Express thuần?',
        options: ['Middleware', 'Routing', 'DI container tích hợp sẵn với quản lý vòng đời', 'Xử lý JSON'],
        answer: 2,
        explain: 'Express không có DI container — bạn tự truyền phụ thuộc hoặc dùng thư viện ngoài. Đây là khác biệt lớn nhất về cách tổ chức code giữa hai nền tảng.' }
    }
  ]
},
{
  id: 'c14', num: 14, title: 'Lộ trình và thói quen học',
  summary: 'Năm giai đoạn, dự án thực hành, cách học hiệu quả.',
  lessons: [
    {
      id: 'c14l1', title: 'Năm giai đoạn',
      body: `
<p>Lộ trình đi theo thứ tự phụ thuộc: mỗi giai đoạn cần giai đoạn trước. Đừng nhảy sang Docker khi chưa viết xong một CRUD tử tế.</p>
<ol>
<li><strong>Nền</strong> — HTTP, một server trả JSON, 5 route CRUD, async/await. <em>Dự án: API quản lý công việc, dữ liệu trong mảng.</em></li>
<li><strong>Dữ liệu</strong> — SQL, quan hệ 1–n và n–n, ORM, migration, phân trang. <em>Dự án: API blog.</em></li>
<li><strong>Cấu trúc và bảo mật</strong> — phân lớp, DTO, validation, JWT, phân quyền, xử lý lỗi tập trung. <em>Dự án: API bán hàng.</em></li>
<li><strong>Chất lượng</strong> — unit test, integration test, log có cấu trúc, Swagger, tối ưu truy vấn.</li>
<li><strong>Đưa lên mạng</strong> — Docker, compose, deploy có HTTPS, CI chạy test, cache Redis. <em>Đưa dự án giai đoạn 3 lên mạng để có link thật cho CV.</em></li>
</ol>
<p>Giai đoạn 3 là ranh giới biến bài tập thành phần mềm. Nhiều người dừng ở giai đoạn 2 và tưởng mình đã biết backend.</p>`,
      check: { type: 'quiz', q: 'Bạn đã viết được CRUD với database và đang muốn học tiếp. Bước hợp lý nhất?',
        options: ['Học Kubernetes và microservice', 'Tách lớp service, thêm DTO, validation và xác thực JWT', 'Chuyển sang học frontend framework mới', 'Tối ưu hiệu năng cho 1 triệu người dùng'],
        answer: 1,
        explain: 'Đây chính là giai đoạn 3 — nơi code trở thành phần mềm thật. Kubernetes và tối ưu quy mô lớn giải quyết vấn đề bạn chưa có.' }
    },
    {
      id: 'c14l2', title: 'Thói quen học hiệu quả',
      body: `
<ul>
<li><strong>Xây lại cùng một dự án qua nhiều giai đoạn</strong> thay vì làm nhiều dự án dở dang. Bạn học được nhiều nhất khi thêm auth vào chính cái API mình đã viết.</li>
<li><strong>Đọc thông báo lỗi đến cùng trước khi tìm kiếm.</strong> Kỹ năng đọc lỗi quan trọng hơn thuộc cú pháp, và nó chỉ luyện được bằng cách không bỏ cuộc sớm.</li>
<li><strong>Mỗi lần copy một đoạn code, tự giải thích từng dòng trước khi chạy.</strong> Nếu có dòng bạn không giải thích được, đó chính là chỗ cần đọc tài liệu.</li>
<li><strong>Commit nhỏ và thường xuyên</strong> từ ngày đầu. Lịch sử git là tài liệu miễn phí về chính quá trình của bạn.</li>
<li><strong>Mỗi khi sửa bug, viết test tái hiện nó trước.</strong> Test đỏ, sửa code, test xanh.</li>
</ul>
<p class="callout">Dấu hiệu bạn đang học đúng: mỗi tuần bạn giải thích được một thứ mà tuần trước chỉ copy được. Dấu hiệu sai: dự án chạy được nhưng bạn không dám sửa vì sợ vỡ.</p>`,
      check: { type: 'quiz', q: 'Cách nào giúp kiến thức đọng lại lâu nhất?',
        options: ['Xem hết một khoá video 40 giờ', 'Copy code mẫu chạy được rồi chuyển bài tiếp theo', 'Tự viết lại tính năng, gặp lỗi, đọc lỗi và sửa', 'Đọc thuộc danh sách status code'],
        answer: 2,
        explain: 'Kiến thức đọng lại khi bạn phải truy xuất và áp dụng nó, đặc biệt lúc gặp lỗi. Xem và copy tạo cảm giác hiểu bài nhưng không tạo ra khả năng làm lại.' }
    }
  ]
},
{
  id: 'c15', num: 15, title: 'Thuật ngữ và tài nguyên',
  summary: 'Từ điển thuật ngữ, tài liệu chính thống, công cụ nên cài sớm.',
  lessons: [
    {
      id: 'c15l1', title: 'Thuật ngữ hay gặp',
      body: `
<table><thead><tr><th>Thuật ngữ</th><th>Nghĩa ngắn gọn</th></tr></thead><tbody>
<tr><td>Endpoint</td><td>Một địa chỉ cụ thể của API: method + đường dẫn</td></tr>
<tr><td>Payload</td><td>Dữ liệu trong body của request hoặc response</td></tr>
<tr><td>Serialize</td><td>Chuyển đối tượng thành JSON để truyền đi</td></tr>
<tr><td>Middleware</td><td>Hàm chạy xen giữa request và handler</td></tr>
<tr><td>DTO</td><td>Đối tượng chuyên để truyền dữ liệu qua ranh giới API</td></tr>
<tr><td>Migration</td><td>File mô tả một thay đổi schema, có phiên bản</td></tr>
<tr><td>Seed</td><td>Dữ liệu mẫu nạp vào database lúc khởi tạo</td></tr>
<tr><td>Idempotent</td><td>Gọi nhiều lần cho cùng kết quả</td></tr>
<tr><td>Race condition</td><td>Hai thao tác chạy đồng thời làm sai dữ liệu</td></tr>
<tr><td>Webhook</td><td>Server khác gọi ngược vào API của bạn khi có sự kiện</td></tr>
<tr><td>IDOR</td><td>Lỗ hổng đổi id trên URL để xem dữ liệu người khác</td></tr>
<tr><td>Swagger / OpenAPI</td><td>Chuẩn mô tả API, sinh tài liệu tự động</td></tr>
</tbody></table>
<p>Danh sách đầy đủ hơn nằm ở mục <em>Thuật ngữ</em> trên thanh điều hướng, có tìm kiếm.</p>`,
      check: { type: 'quiz', q: 'Đồng nghiệp nói "endpoint này chưa idempotent nên retry sinh ra đơn trùng". Vấn đề là gì?',
        options: ['Endpoint chạy quá chậm', 'Gọi lại cùng một request tạo thêm bản ghi mới thay vì trả kết quả cũ', 'Endpoint thiếu xác thực', 'Endpoint trả sai định dạng JSON'],
        answer: 1,
        explain: 'Idempotent nghĩa là gọi lại cho cùng kết quả. Với POST tạo đơn, cách xử lý là khoá Idempotency-Key: server nhớ khoá và trả lại kết quả cũ thay vì tạo đơn thứ hai.' }
    },
    {
      id: 'c15l2', title: 'Tài liệu và công cụ',
      body: `
<p>Tài liệu chính thống nên đọc thay vì blog ngẫu nhiên:</p>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP" target="_blank" rel="noopener">MDN — HTTP</a>: tra method, status code, header.</li>
<li><a href="https://expressjs.com/" target="_blank" rel="noopener">Express</a> và <a href="https://nodejs.org/docs/latest/api/" target="_blank" rel="noopener">Node.js API</a>.</li>
<li><a href="https://learn.microsoft.com/en-us/aspnet/core/" target="_blank" rel="noopener">Microsoft Learn — ASP.NET Core</a>: đầy đủ, có tutorial từng bước.</li>
<li><a href="https://www.prisma.io/docs" target="_blank" rel="noopener">Prisma</a> và <a href="https://learn.microsoft.com/en-us/ef/core/" target="_blank" rel="noopener">EF Core</a>.</li>
<li><a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noopener">OWASP Top 10</a>: danh sách lỗi bảo mật phổ biến nhất.</li>
</ul>
<table><thead><tr><th>Công cụ</th><th>Dùng để</th></tr></thead><tbody>
<tr><td>Postman / Thunder Client</td><td>Gọi thử API</td></tr>
<tr><td>DBeaver / pgAdmin</td><td>Xem và truy vấn database</td></tr>
<tr><td>Docker Desktop</td><td>Chạy database và dịch vụ phụ</td></tr>
<tr><td>Git + GitHub</td><td>Lưu lịch sử, làm portfolio</td></tr>
<tr><td>Swagger UI</td><td>Xem và thử API trong trình duyệt</td></tr>
</tbody></table>`,
      check: { type: 'quiz', q: 'Bạn cần biết chính xác ASP.NET Core cấu hình JWT thế nào ở phiên bản hiện tại. Nguồn nào đáng tin nhất?',
        options: ['Một bài blog năm 2019', 'Câu trả lời đầu tiên trên Stack Overflow', 'Tài liệu trên Microsoft Learn cho đúng phiên bản .NET đang dùng', 'Video YouTube nhiều lượt xem nhất'],
        answer: 2,
        explain: 'API xác thực của .NET thay đổi qua các phiên bản. Tài liệu chính thống có bộ chọn phiên bản, nên nó là nguồn duy nhất chắc chắn khớp với code bạn đang viết.' }
    }
  ]
}
];
