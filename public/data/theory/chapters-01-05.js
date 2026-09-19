/* Lý thuyết — chương 1 đến 5 */

export default [
{
  id: 'c1', num: 1, title: 'Backend là gì',
  summary: 'Bức tranh tổng thể: request đi qua đâu, server gồm những gì, ba khái niệm nền.',
  lessons: [
    {
      id: 'c1l1', title: 'Đường đi của một request',
      body: `
<p>Backend là phần chương trình chạy trên máy chủ: nhận yêu cầu từ client, xử lý nghiệp vụ, đọc/ghi dữ liệu rồi trả kết quả về. Người dùng không bao giờ nhìn thấy nó trực tiếp.</p>
<p>Khi bạn gõ một địa chỉ và nhấn Enter, request đi qua một chuỗi chặng khá cố định:</p>
<pre class="mermaid">
flowchart LR
  A[Client] --> B[DNS + HTTPS]
  B --> C[Reverse proxy]
  C --> D[Ứng dụng backend]
  D --> E[(Database)]
  D --> F[(Cache)]
</pre>
<p>Mỗi chặng có thể là nơi hỏng. Khi debug, thói quen tốt là hỏi <em>request chết ở chặng nào</em> trước khi đọc code: trình duyệt không gọi được (CORS, DNS), proxy trả 502, ứng dụng trả 500, hay database chậm.</p>
<p class="callout">Reverse proxy (Nginx, IIS, Caddy) đứng trước ứng dụng để lo HTTPS, nén, phục vụ file tĩnh. Ứng dụng của bạn thường chỉ nghe HTTP thường ở cổng nội bộ như 3000 hay 5000.</p>`,
      check: { type: 'quiz', q: 'Ứng dụng backend chạy tốt trên máy bạn, nhưng khi deploy thì trình duyệt báo lỗi 502 Bad Gateway. Chặng nào nhiều khả năng có vấn đề nhất?',
        options: ['Code nghiệp vụ trong controller', 'Reverse proxy không kết nối được tới ứng dụng phía sau', 'Trình duyệt của người dùng', 'Câu lệnh SQL bị sai cú pháp'],
        answer: 1,
        explain: '502 nghĩa là proxy nhận được request nhưng không nhận được phản hồi hợp lệ từ ứng dụng phía sau — thường do ứng dụng chưa chạy, sai cổng, hoặc vừa crash. Lỗi trong controller sẽ cho 500, không phải 502.' }
    },
    {
      id: 'c1l2', title: 'Các thành phần bên trong ứng dụng',
      body: `
<p>Gần như mọi framework backend đều có cùng bộ phận, chỉ khác tên gọi:</p>
<table><thead><tr><th>Thành phần</th><th>Vai trò</th></tr></thead><tbody>
<tr><td>Routing</td><td>Ánh xạ method + URL tới hàm xử lý</td></tr>
<tr><td>Middleware</td><td>Chạy trước/sau mỗi request: log, auth, CORS</td></tr>
<tr><td>Controller</td><td>Nhận request, gọi nghiệp vụ, trả response</td></tr>
<tr><td>Service</td><td>Chứa logic nghiệp vụ</td></tr>
<tr><td>Repository</td><td>Nói chuyện với database</td></tr>
<tr><td>Model / Entity</td><td>Hình dạng dữ liệu</td></tr>
</tbody></table>
<p>Hiểu bảng này một lần là bạn đọc được code của cả Express lẫn ASP.NET Core. Khi học framework mới, câu hỏi đầu tiên nên là: <em>routing khai báo ở đâu, middleware xếp thế nào, service lấy phụ thuộc từ đâu</em>.</p>`,
      check: { type: 'quiz', q: 'Đoạn code tính "đơn hàng trên 2 triệu được giảm 5%" nên nằm ở lớp nào?',
        options: ['Controller, vì nó nhận request', 'Service, vì đó là quy tắc nghiệp vụ', 'Repository, vì cần đọc giá từ database', 'Middleware, vì áp dụng cho mọi request'],
        answer: 1,
        explain: 'Quy tắc nghiệp vụ thuộc về service. Controller chỉ nhận/trả HTTP, repository chỉ đọc ghi dữ liệu. Đặt quy tắc ở service giúp test được mà không cần dựng server hay database.' }
    },
    {
      id: 'c1l3', title: 'Stateless và idempotent',
      body: `
<p>Hai tính từ này xuất hiện trong mọi tài liệu backend, và hiểu sai chúng dẫn tới lỗi rất khó tìm.</p>
<p><strong>Stateless</strong> — server không nhớ gì về request trước. Mọi thứ cần biết phải nằm trong chính request (token, tham số) hoặc trong database. Nhờ vậy bạn có thể chạy 5 bản sao ứng dụng sau load balancer mà không quan tâm request rơi vào bản nào.</p>
<p><strong>Idempotent</strong> — gọi lại nhiều lần cho cùng kết quả. <code>GET</code>, <code>PUT</code>, <code>DELETE</code> nên idempotent; <code>POST</code> thì không. Điều này quan trọng vì mạng không đáng tin: client mất kết nối giữa chừng sẽ gọi lại, và nếu <code>POST /orders</code> không được bảo vệ, khách hàng có hai đơn hàng.</p>
<p class="callout">Cách xử lý thực tế cho POST: client sinh một khoá <code>Idempotency-Key</code> gửi kèm; server lưu khoá đó và trả lại kết quả cũ nếu thấy khoá đã dùng.</p>`,
      check: { type: 'ex', exId: 'node-08' }
    }
  ]
},
{
  id: 'c2', num: 2, title: 'HTTP và REST API',
  summary: 'Method, status code, tham số, nguyên tắc thiết kế REST và CORS.',
  lessons: [
    {
      id: 'c2l1', title: 'Method và status code',
      body: `
<p>Mỗi API là một hợp đồng: method + URL + header + body. Method nói bạn muốn làm gì, status code nói kết quả ra sao.</p>
<table><thead><tr><th>Method</th><th>Dùng khi</th><th>Idempotent</th></tr></thead><tbody>
<tr><td>GET</td><td>Lấy dữ liệu</td><td>Có</td></tr>
<tr><td>POST</td><td>Tạo mới hoặc hành động</td><td>Không</td></tr>
<tr><td>PUT</td><td>Thay toàn bộ tài nguyên</td><td>Có</td></tr>
<tr><td>PATCH</td><td>Sửa một phần</td><td>Không bắt buộc</td></tr>
<tr><td>DELETE</td><td>Xoá</td><td>Có</td></tr>
</tbody></table>
<p>Status code chia theo nhóm: <strong>2xx</strong> thành công, <strong>3xx</strong> chuyển hướng, <strong>4xx</strong> lỗi do client, <strong>5xx</strong> lỗi do server. Ranh giới 4xx/5xx rất quan trọng khi giám sát: 4xx tăng nghĩa là client gọi sai, 5xx tăng nghĩa là bạn phải sửa code ngay.</p>
<p>Ba cặp hay nhầm:</p>
<ul>
<li><code>401</code> chưa đăng nhập hoặc token sai — <code>403</code> đã biết bạn là ai nhưng không đủ quyền.</li>
<li><code>400</code> body sai định dạng — <code>422</code> định dạng đúng nhưng giá trị không hợp lệ.</li>
<li><code>200</code> có body trả về — <code>204</code> thành công nhưng không có body.</li>
</ul>`,
      check: { type: 'ex', exId: 'node-01' }
    },
    {
      id: 'c2l2', title: 'Ba nơi truyền tham số',
      body: `
<p>Dữ liệu từ client vào server đi theo ba đường, mỗi đường có mục đích riêng:</p>
<ul>
<li><strong>Path param</strong> định danh tài nguyên: <code>/api/products/42</code></li>
<li><strong>Query param</strong> lọc, sắp xếp, phân trang: <code>/api/products?category=book&amp;page=2</code></li>
<li><strong>Body</strong> dữ liệu gửi lên, thường là JSON</li>
</ul>
<p>Quy tắc chọn: thứ <em>xác định</em> tài nguyên nào thì vào path; thứ <em>thay đổi cách nhìn</em> tập kết quả thì vào query; thứ <em>nội dung</em> muốn ghi thì vào body.</p>
<p>Một điểm hay sai: query param luôn là chuỗi. <code>?page=2</code> cho bạn <code>"2"</code> chứ không phải <code>2</code>, và <code>"2" + 1</code> ra <code>"21"</code>. Luôn ép kiểu và đặt giá trị mặc định.</p>`,
      check: { type: 'ex', exId: 'node-02' }
    },
    {
      id: 'c2l3', title: 'Thiết kế REST cho dễ dùng',
      body: `
<p>REST không phải chuẩn bắt buộc, nhưng làm theo quy ước giúp người khác đoán được API của bạn mà không cần đọc tài liệu.</p>
<ol>
<li>URL là <strong>danh từ số nhiều</strong>: <code>/api/orders</code>, không phải <code>/api/getOrders</code>.</li>
<li>Hành động nằm ở method, không nằm ở URL.</li>
<li>Lồng nhau tối đa một cấp: <code>/api/orders/42/items</code>.</li>
<li>Danh sách luôn phân trang, không trả về cả bảng.</li>
<li>Versioning khi phá vỡ tương thích: <code>/api/v1/...</code>.</li>
</ol>
<p>Có những hành động không nằm gọn trong CRUD — huỷ đơn, gửi lại email xác thực. Cách thực dụng là dùng POST tới một đường dẫn con: <code>POST /api/orders/42/cancel</code>. Đừng cố ép mọi thứ thành danh từ.</p>`,
      check: { type: 'quiz', q: 'API nào sau đây theo quy ước REST tốt nhất cho việc "lấy danh sách bình luận của bài viết số 7"?',
        options: ['GET /api/getComments?postId=7', 'POST /api/comments/list', 'GET /api/posts/7/comments', 'GET /api/comment/post/7/all'],
        answer: 2,
        explain: 'Danh từ số nhiều, lồng một cấp thể hiện quan hệ sở hữu, hành động nằm ở method GET. Các phương án khác đặt động từ vào URL hoặc dùng sai method.' }
    },
    {
      id: 'c2l4', title: 'CORS — lỗi số một của người mới',
      body: `
<p>Trình duyệt chặn request từ origin khác trừ khi server trả về header cho phép. Origin gồm giao thức + tên miền + cổng, nên <code>localhost:3000</code> và <code>localhost:5173</code> là hai origin khác nhau.</p>
<p>Điều quan trọng nhất: <strong>lỗi CORS luôn được sửa ở server</strong>, không sửa được ở frontend. Thấy dòng "blocked by CORS policy" trong console nghĩa là server thiếu header, chứ không phải fetch viết sai.</p>
<pre><code>// Express
app.use(cors({ origin: 'https://myapp.com', credentials: true }));</code></pre>
<pre><code>// ASP.NET Core
builder.Services.AddCors(o =&gt; o.AddDefaultPolicy(p =&gt;
    p.WithOrigins("https://myapp.com").AllowAnyHeader().AllowAnyMethod()));
app.UseCors();</code></pre>
<p class="callout">Đừng để <code>AllowAnyOrigin</code> ở môi trường thật khi API có xác thực bằng cookie — đó là mở cửa cho tấn công CSRF.</p>`,
      check: { type: 'quiz', q: 'Frontend chạy ở localhost:5173 gọi API ở localhost:5000 và bị chặn CORS. Bạn sửa ở đâu?',
        options: ['Thêm header vào fetch ở frontend', 'Cấu hình CORS ở server API cho phép origin localhost:5173', 'Tắt JavaScript trong trình duyệt', 'Đổi phương thức từ GET sang POST'],
        answer: 1,
        explain: 'Chỉ server mới cấp quyền được. Frontend không thể tự cho phép mình — nếu làm được thì cơ chế CORS đã vô nghĩa.' }
    }
  ]
},
{
  id: 'c3', num: 3, title: 'Kiến trúc ứng dụng',
  summary: 'Phân lớp Controller–Service–Repository, DTO, dependency injection, cấu trúc thư mục.',
  lessons: [
    {
      id: 'c3l1', title: 'Ba lớp và ranh giới của chúng',
      body: `
<p>Mục tiêu duy nhất của phân lớp: mỗi lớp chỉ làm một việc, để sửa chỗ này không vỡ chỗ khác.</p>
<table><thead><tr><th>Lớp</th><th>Được làm</th><th>Không được làm</th></tr></thead><tbody>
<tr><td>Controller</td><td>Đọc request, trả status code</td><td>Viết SQL, tính toán nghiệp vụ</td></tr>
<tr><td>Service</td><td>Quy tắc nghiệp vụ, transaction</td><td>Biết tới HTTP, đọc <code>req.body</code></td></tr>
<tr><td>Repository</td><td>CRUD, truy vấn</td><td>Chứa quy tắc nghiệp vụ</td></tr>
</tbody></table>
<p>Phép thử nhanh: nếu bạn phải dựng một HTTP server để test quy tắc "đơn dưới 50 nghìn không được giảm giá", thì quy tắc đó đang nằm sai chỗ.</p>
<p>Đừng phân lớp quá sớm cho dự án nhỏ. Nhưng ngay khi một file controller vượt 200 dòng, đó là tín hiệu tách service.</p>`,
      check: { type: 'quiz', q: 'Dấu hiệu nào cho thấy service đang bị "rò rỉ" tầng HTTP?',
        options: ['Service trả về một đối tượng thuần', 'Service nhận vào một DTO', 'Service đọc req.headers và gọi res.status(404)', 'Service gọi hai repository khác nhau'],
        answer: 2,
        explain: 'Service chạm vào req/res nghĩa là nó chỉ dùng được từ HTTP — không gọi lại được từ job nền, CLI hay test. Service nên nhận dữ liệu thuần và ném lỗi nghiệp vụ, để controller dịch thành status code.' }
    },
    {
      id: 'c3l2', title: 'DTO và Entity',
      body: `
<p><strong>Entity</strong> là hình dạng dữ liệu trong database — có <code>passwordHash</code>, <code>deletedAt</code>, <code>internalNote</code>. <strong>DTO</strong> là hình dạng dữ liệu đi ra/vào qua API.</p>
<p>Trả thẳng entity ra ngoài gây ba vấn đề: lộ trường nhạy cảm, buộc API phải thay đổi mỗi khi đổi cấu trúc bảng, và khiến client phụ thuộc vào chi tiết lưu trữ.</p>
<pre><code>// Node
function toUserDto(user) {
  return { id: user.id, email: user.email, name: user.name };
}</code></pre>
<pre><code>// C#
public record UserDto(int Id, string Email, string Name);</code></pre>
<p class="callout">Quy tắc thực dụng: DTO ra và DTO vào thường khác nhau. <code>CreateUserDto</code> có <code>password</code> nhưng không có <code>id</code>; <code>UserDto</code> có <code>id</code> nhưng không bao giờ có <code>password</code>.</p>`,
      check: { type: 'ex', exId: 'node-05' }
    },
    {
      id: 'c3l3', title: 'Dependency Injection',
      body: `
<p>Thay vì lớp tự tạo thứ nó cần, ta đưa từ ngoài vào. Lợi ích cụ thể: đổi database hay thay bằng bản giả khi test chỉ là đổi một dòng đăng ký.</p>
<pre><code>// Tự tạo — khó test
class OrderService {
  constructor() { this.repo = new PostgresOrderRepo(); }
}

// Tiêm vào — dễ test
class OrderService {
  constructor(repo) { this.repo = repo; }
}</code></pre>
<p>ASP.NET Core có sẵn DI container và ba vòng đời:</p>
<ul>
<li><code>Transient</code> — mỗi lần yêu cầu một instance mới</li>
<li><code>Scoped</code> — một instance cho mỗi request (dùng cho service, repository, <code>DbContext</code>)</li>
<li><code>Singleton</code> — một instance cho cả ứng dụng (cấu hình, cache)</li>
</ul>
<p>Lỗi kinh điển: tiêm <code>Scoped</code> vào <code>Singleton</code>. Singleton sống mãi nên sẽ giữ lại một <code>DbContext</code> đã chết, gây lỗi rất khó đoán ở môi trường thật.</p>`,
      check: { type: 'ex', exId: 'net-05' }
    }
  ]
},
{
  id: 'c4', num: 4, title: 'Cơ sở dữ liệu',
  summary: 'SQL và NoSQL, quan hệ, index, transaction, N+1 và migration.',
  lessons: [
    {
      id: 'c4l1', title: 'Chọn SQL hay NoSQL',
      body: `
<p>Với người mới, câu trả lời gần như luôn là SQL. PostgreSQL và SQL Server chiếm phần lớn dự án thực tế, và kỹ năng SQL chuyển được giữa mọi ngôn ngữ.</p>
<table><thead><tr><th></th><th>SQL</th><th>NoSQL</th></tr></thead><tbody>
<tr><td>Cấu trúc</td><td>Bảng, schema cố định</td><td>Document, linh hoạt</td></tr>
<tr><td>Quan hệ</td><td>JOIN mạnh</td><td>Phải nhúng hoặc tự gộp</td></tr>
<tr><td>Transaction</td><td>Đầy đủ ACID</td><td>Hạn chế hơn</td></tr>
<tr><td>Hợp với</td><td>Đơn hàng, tài chính</td><td>Log, cache, dữ liệu không đều</td></tr>
</tbody></table>
<p>Redis thường xuất hiện <em>cùng</em> SQL chứ không thay thế: SQL giữ sự thật, Redis giữ bản sao nhanh.</p>`,
      check: { type: 'quiz', q: 'Ứng dụng đặt vé máy bay cần đảm bảo không bán trùng ghế. Lựa chọn nào phù hợp nhất?',
        options: ['MongoDB vì schema linh hoạt', 'Redis vì rất nhanh', 'Một cơ sở dữ liệu SQL với transaction và ràng buộc unique', 'File JSON trên đĩa'],
        answer: 2,
        explain: 'Đây là bài toán cần tính nhất quán tuyệt đối: transaction ACID và ràng buộc unique ở tầng database là thứ ngăn hai người cùng đặt một ghế. Tốc độ không có ý nghĩa nếu dữ liệu sai.' }
    },
    {
      id: 'c4l2', title: 'Quan hệ và chuẩn hoá',
      body: `
<p>Ba loại quan hệ, và nơi đặt khoá ngoại:</p>
<ul>
<li><strong>1–1</strong>: <code>User</code> ↔ <code>UserProfile</code>. Khoá ngoại ở một bên, kèm ràng buộc unique.</li>
<li><strong>1–n</strong>: <code>Order</code> có nhiều <code>OrderItem</code>. Khoá ngoại ở bên "nhiều".</li>
<li><strong>n–n</strong>: <code>Product</code> ↔ <code>Tag</code>. Cần bảng trung gian <code>ProductTag(productId, tagId)</code>.</li>
</ul>
<p>Chuẩn hoá nghĩa là mỗi dữ kiện chỉ lưu ở một chỗ. Nếu tên khách hàng xuất hiện ở cả bảng <code>Customer</code> lẫn bảng <code>Order</code>, sớm muộn hai chỗ sẽ khác nhau.</p>
<p>Có một ngoại lệ cố ý: lưu <em>giá tại thời điểm mua</em> vào <code>OrderItem</code>. Đó không phải trùng lặp — giá sản phẩm hôm nay và giá lúc khách đặt là hai dữ kiện khác nhau.</p>`,
      check: { type: 'quiz', q: 'Một sinh viên học nhiều môn, một môn có nhiều sinh viên. Thiết kế bảng đúng là gì?',
        options: ['Thêm cột danh sách môn học vào bảng Student', 'Thêm cột studentId vào bảng Course', 'Tạo bảng trung gian Enrollment(studentId, courseId)', 'Gộp cả hai thành một bảng duy nhất'],
        answer: 2,
        explain: 'Quan hệ n–n luôn cần bảng trung gian. Bảng đó cũng là nơi tự nhiên để lưu thêm thông tin về chính mối quan hệ, ví dụ ngày đăng ký hay điểm số.' }
    },
    {
      id: 'c4l3', title: 'Index và truy vấn chậm',
      body: `
<p>Index là cấu trúc tra cứu giúp tìm dòng nhanh, đổi lại làm ghi chậm hơn và tốn dung lượng. Nên đánh index cho: khoá ngoại, cột hay xuất hiện trong <code>WHERE</code>/<code>ORDER BY</code>/<code>JOIN</code>, và cột cần unique.</p>
<p>Đừng đoán — dùng <code>EXPLAIN</code> (PostgreSQL/MySQL) hoặc execution plan (SQL Server) để xem query có thực sự dùng index hay đang quét toàn bảng.</p>
<pre><code>EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 7 ORDER BY created_at DESC LIMIT 20;</code></pre>
<p>Thấy <code>Seq Scan</code> trên bảng lớn là dấu hiệu thiếu index. Thấy <code>Index Scan</code> là đúng hướng.</p>
<p class="callout">Index nhiều cột có thứ tự quan trọng: index trên <code>(customer_id, created_at)</code> giúp query lọc theo customer rồi sắp theo ngày, nhưng không giúp query chỉ sắp theo ngày.</p>`,
      check: { type: 'quiz', q: 'Query lọc theo email chạy 3 giây trên bảng 2 triệu dòng. Bước đầu tiên hợp lý nhất là gì?',
        options: ['Chuyển sang MongoDB', 'Thêm cache Redis trước database', 'Chạy EXPLAIN để xem có index trên cột email chưa', 'Tăng RAM cho máy chủ'],
        answer: 2,
        explain: 'Đo trước, tối ưu sau. Một index trên cột email thường đưa 3 giây xuống vài mili giây. Cache hay phần cứng chỉ che giấu vấn đề và tốn kém hơn nhiều.' }
    },
    {
      id: 'c4l4', title: 'Transaction và N+1',
      body: `
<p><strong>Transaction</strong> gói nhiều lệnh thành một đơn vị: hoặc tất cả thành công, hoặc quay về như cũ. Bắt buộc dùng khi một thao tác chạm vào nhiều bảng — trừ tồn kho và tạo đơn hàng phải cùng sống hoặc cùng chết.</p>
<pre><code>// Prisma
await prisma.$transaction(async (tx) =&gt; {
  await tx.product.update({ where: { id }, data: { stock: { decrement: qty } } });
  await tx.order.create({ data: { productId: id, quantity: qty } });
});</code></pre>
<p><strong>N+1 query</strong> là lỗi hiệu năng phổ biến nhất khi dùng ORM: lấy 100 đơn hàng rồi lặp vòng để lấy khách hàng của từng đơn, tổng cộng 101 truy vấn. Khắc phục bằng eager loading (<code>include</code> ở Prisma, <code>Include()</code> ở EF Core) hoặc một JOIN.</p>
<p>Cách phát hiện: bật log query khi phát triển. Thấy cùng một câu SQL lặp lại hàng chục lần là N+1.</p>`,
      check: { type: 'ex', exId: 'node-09' }
    }
  ]
},
{
  id: 'c5', num: 5, title: 'Truy cập dữ liệu và ORM',
  summary: 'ORM so với SQL thô, Prisma và EF Core, tham số hoá chống SQL injection.',
  lessons: [
    {
      id: 'c5l1', title: 'ORM làm gì cho bạn',
      body: `
<p>ORM ánh xạ bảng thành lớp trong code, để bạn viết <code>db.products.findMany()</code> thay vì chuỗi SQL.</p>
<table><thead><tr><th>Công cụ</th><th>Nền tảng</th><th>Đặc điểm</th></tr></thead><tbody>
<tr><td>Prisma</td><td>Node.js</td><td>Schema riêng, sinh type TypeScript, dễ học nhất</td></tr>
<tr><td>Sequelize</td><td>Node.js</td><td>Lâu đời, nhiều tài liệu</td></tr>
<tr><td>EF Core</td><td>.NET</td><td>ORM chính thức, LINQ, migration tốt</td></tr>
<tr><td>Dapper</td><td>.NET</td><td>Micro-ORM, viết SQL tay, rất nhanh</td></tr>
</tbody></table>
<p>Nguyên tắc chọn: ORM cho CRUD thông thường (khoảng 90% công việc), SQL thô cho báo cáo phức tạp và thao tác hàng loạt. Trộn cả hai là bình thường, không phải thất bại thiết kế.</p>`,
      check: { type: 'quiz', q: 'Khi nào nên bỏ ORM để viết SQL thô?',
        options: ['Khi tạo một bản ghi mới', 'Khi báo cáo cần gộp nhiều bảng với window function và ORM sinh ra query chậm', 'Khi lấy một bản ghi theo id', 'Không bao giờ — ORM luôn tốt hơn'],
        answer: 1,
        explain: 'ORM mạnh ở CRUD nhưng yếu ở truy vấn phân tích phức tạp. Khi bạn đã đo được rằng query do ORM sinh ra chậm, viết SQL tay cho riêng chỗ đó là lựa chọn đúng.' }
    },
    {
      id: 'c5l2', title: 'SQL injection và tham số hoá',
      body: `
<p>Đây là lỗ hổng bảo mật lâu đời nhất và vẫn phổ biến nhất. Nó xảy ra khi dữ liệu người dùng được nối thẳng vào câu SQL.</p>
<pre><code>// SAI — người dùng nhập: 1 OR 1=1
const sql = "SELECT * FROM users WHERE id = " + req.query.id;</code></pre>
<p>Cách sửa duy nhất đúng là <strong>tham số hoá</strong>: giá trị đi theo đường riêng, không bao giờ được hiểu là cú pháp SQL.</p>
<pre><code>// ĐÚNG
await db.query('SELECT * FROM users WHERE id = $1', [id]);</code></pre>
<pre><code>// C# — Dapper
await conn.QueryAsync&lt;User&gt;("SELECT * FROM Users WHERE Id = @id", new { id });</code></pre>
<p>ORM tham số hoá tự động, nên chỉ cần cảnh giác khi bạn gọi raw query. Lọc ký tự đặc biệt bằng tay <em>không</em> phải giải pháp — luôn có cách vượt qua.</p>`,
      check: { type: 'ex', exId: 'node-20' }
    },
    {
      id: 'c5l3', title: 'Ba thói quen truy vấn tốt',
      body: `
<p><strong>Chỉ lấy cột cần dùng.</strong> <code>SELECT *</code> trên bảng có cột <code>description</code> dài làm chậm mọi thứ khi bạn chỉ cần tên và giá.</p>
<pre><code>// Prisma
const list = await prisma.product.findMany({
  select: { id: true, name: true, price: true },
  take: 20,
});</code></pre>
<p><strong>Luôn async.</strong> Gọi database đồng bộ sẽ khoá server. Trong Node đó là mất toàn bộ khả năng phục vụ; trong .NET đó là chiếm một thread khỏi pool.</p>
<p><strong>Không truy vấn trong vòng lặp.</strong> Nếu thấy <code>for</code> bao quanh một lệnh <code>await db...</code>, hãy dừng lại và nghĩ cách gộp thành một truy vấn với <code>IN</code> hoặc JOIN.</p>
<pre><code>// Thay vì N truy vấn
const users = await prisma.user.findMany({ where: { id: { in: ids } } });</code></pre>`,
      check: { type: 'quiz', q: 'Code nào dưới đây có vấn đề hiệu năng nghiêm trọng nhất?',
        options: ['const u = await repo.findById(id)', 'for (const id of ids) { results.push(await repo.findById(id)) }', 'const list = await repo.findMany({ take: 20 })', 'await repo.findMany({ where: { id: { in: ids } } })'],
        answer: 1,
        explain: 'Đây chính là N+1: mỗi vòng lặp là một round-trip tới database. Với 200 id đó là 200 lần chờ mạng. Phương án cuối cùng làm đúng việc đó bằng một truy vấn.' }
    }
  ]
}
];
