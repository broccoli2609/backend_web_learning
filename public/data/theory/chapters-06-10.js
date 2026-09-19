/* Lý thuyết — chương 6 đến 10 */

export default [
{
  id: 'c6', num: 6, title: 'Xác thực và phân quyền',
  summary: 'Session và JWT, hash mật khẩu, access/refresh token, RBAC và quyền sở hữu.',
  lessons: [
    {
      id: 'c6l1', title: 'Authentication khác Authorization',
      body: `
<p><strong>Authentication</strong> trả lời "bạn là ai". <strong>Authorization</strong> trả lời "bạn được làm gì". Hai bước tách biệt, chạy theo đúng thứ tự đó.</p>
<p>Trong ASP.NET Core điều này hiện rõ trong pipeline:</p>
<pre><code>app.UseAuthentication();   // đọc token, dựng ClaimsPrincipal
app.UseAuthorization();    // kiểm tra [Authorize] và policy</code></pre>
<p>Đảo thứ tự hai dòng này là một lỗi rất hay gặp: authorization chạy trước khi biết người dùng là ai, nên mọi endpoint có <code>[Authorize]</code> đều trả 401 dù token hoàn toàn hợp lệ.</p>
<p>Ở Express thứ tự cũng vậy, chỉ là bạn tự viết:</p>
<pre><code>router.post('/orders', requireAuth, requireRole('customer'), createOrder);</code></pre>`,
      check: { type: 'quiz', q: 'Người dùng đã đăng nhập bằng tài khoản thường, gọi endpoint chỉ dành cho admin. Server nên trả mã nào?',
        options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '400 Bad Request'],
        answer: 1,
        explain: '401 là "tôi chưa biết bạn là ai"; ở đây server đã biết, chỉ là không đủ quyền — đó là 403. Một số hệ thống cố tình trả 404 để không lộ sự tồn tại của tài nguyên, nhưng mặc định đúng là 403.' }
    },
    {
      id: 'c6l2', title: 'Session hay JWT',
      body: `
<table><thead><tr><th></th><th>Session + Cookie</th><th>JWT</th></tr></thead><tbody>
<tr><td>Nơi lưu trạng thái</td><td>Server</td><td>Trong chính token</td></tr>
<tr><td>Thu hồi</td><td>Dễ — xoá session</td><td>Khó — cần blacklist</td></tr>
<tr><td>Nhiều server</td><td>Cần store chung</td><td>Không cần</td></tr>
<tr><td>Hợp với</td><td>Web truyền thống</td><td>API, mobile, microservice</td></tr>
</tbody></table>
<p>JWT gồm ba phần ngăn bởi dấu chấm: header, payload, signature — mã hoá base64url. Điều quan trọng nhất phải nhớ: <strong>JWT chỉ được ký, không được mã hoá</strong>. Bất kỳ ai cầm token đều đọc được payload. Không bao giờ nhét số điện thoại, địa chỉ hay bất cứ dữ liệu nhạy cảm nào vào đó.</p>
<p>Chữ ký chỉ chứng minh token không bị sửa, và chỉ khi server kiểm tra đúng. Một lỗi nổi tiếng là chấp nhận <code>alg: none</code> — luôn cấu hình thuật toán cụ thể thay vì tin vào header của token.</p>`,
      check: { type: 'ex', exId: 'node-11' }
    },
    {
      id: 'c6l3', title: 'Access token và refresh token',
      body: `
<pre class="mermaid">
sequenceDiagram
  Client-&gt;&gt;API: POST /auth/login
  API--&gt;&gt;Client: access (15p) + refresh (7 ngày)
  Client-&gt;&gt;API: GET /orders + Bearer access
  API--&gt;&gt;Client: 200 dữ liệu
  Client-&gt;&gt;API: POST /auth/refresh
  API--&gt;&gt;Client: access mới
</pre>
<p><strong>Access token</strong> sống ngắn (5–15 phút) và gửi kèm mọi request. <strong>Refresh token</strong> sống dài, lưu an toàn trong httpOnly cookie, chỉ dùng để xin access token mới.</p>
<p>Lý do chia đôi: nếu access token bị lộ, kẻ tấn công chỉ dùng được vài phút. Nếu chỉ có một token sống 7 ngày, lộ một lần là mất một tuần.</p>
<p class="callout">Lưu access token ở đâu trên client? <code>localStorage</code> tiện nhưng bị XSS đọc được. httpOnly cookie an toàn hơn trước XSS nhưng cần chống CSRF bằng <code>SameSite=Strict</code> và token chống giả mạo.</p>`,
      check: { type: 'ex', exId: 'node-12' }
    },
    {
      id: 'c6l4', title: 'Mật khẩu và hash',
      body: `
<p>Không bao giờ lưu mật khẩu dạng rõ, và không dùng MD5 hay SHA-1 — chúng được thiết kế để <em>nhanh</em>, đúng thứ kẻ tấn công cần khi dò hàng tỷ mật khẩu mỗi giây.</p>
<p>Dùng hàm băm <strong>chậm có salt</strong>: bcrypt hoặc Argon2 bên Node, ASP.NET Core Identity (PBKDF2) bên .NET.</p>
<pre><code>// Node
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(input, user.passwordHash);</code></pre>
<p>Salt là chuỗi ngẫu nhiên thêm vào trước khi băm, khiến hai người cùng mật khẩu có hash khác nhau — vô hiệu hoá bảng tra sẵn. bcrypt tự sinh và nhúng salt vào kết quả, bạn không phải tự quản lý.</p>
<p class="callout">Khi đăng nhập sai, trả về đúng một thông báo chung "Email hoặc mật khẩu không đúng". Phân biệt "email không tồn tại" và "sai mật khẩu" cho kẻ tấn công biết tài khoản nào có thật.</p>`,
      check: { type: 'quiz', q: 'Vì sao bcrypt phù hợp để băm mật khẩu hơn SHA-256?',
        options: ['Vì bcrypt cho chuỗi ngắn hơn', 'Vì bcrypt cố ý chậm và có salt, làm việc dò mật khẩu hàng loạt trở nên tốn kém', 'Vì bcrypt mã hoá hai chiều nên khôi phục được mật khẩu', 'Vì SHA-256 đã bị phá'],
        answer: 1,
        explain: 'Độ chậm là tính năng, không phải nhược điểm. Với bcrypt, thử một tỷ mật khẩu mất hàng năm thay vì vài giây. Và không có hàm băm nào khôi phục được mật khẩu — đó là điều tốt.' }
    },
    {
      id: 'c6l5', title: 'Phân quyền và lỗ hổng IDOR',
      body: `
<p>Ba mức phân quyền, từ đơn giản tới linh hoạt:</p>
<ul>
<li><strong>Role-based</strong> — <code>Admin</code>, <code>Staff</code>, <code>Customer</code>. Đủ cho đa số dự án.</li>
<li><strong>Permission-based</strong> — <code>order.create</code>, <code>order.refund</code>. Linh hoạt khi hệ thống lớn.</li>
<li><strong>Ownership</strong> — "đơn hàng này có phải của chính người gọi không".</li>
</ul>
<p>Mức thứ ba hay bị quên nhất, và tạo ra lỗ hổng <strong>IDOR</strong> (Insecure Direct Object Reference): người dùng đã đăng nhập đổi <code>/api/orders/42</code> thành <code>/api/orders/43</code> và đọc được đơn của người khác.</p>
<pre><code>// Thiếu — chỉ kiểm tra đã đăng nhập
const order = await repo.findById(id);
return res.json(order);

// Đủ — kiểm tra cả quyền sở hữu
const order = await repo.findById(id);
if (!order || order.customerId !== req.user.id) return res.status(404).end();</code></pre>
<p>Trả 404 thay vì 403 ở đây là cố ý: không tiết lộ rằng đơn hàng đó tồn tại.</p>`,
      check: { type: 'ex', exId: 'node-14' }
    }
  ]
},
{
  id: 'c7', num: 7, title: 'Validation, lỗi và logging',
  summary: 'Validate đầu vào, xử lý lỗi tập trung, log có cấu trúc, health check.',
  lessons: [
    {
      id: 'c7l1', title: 'Validate ở server là bắt buộc',
      body: `
<p>Validate ở frontend chỉ để trải nghiệm tốt hơn. Bất kỳ ai cũng gọi thẳng API bằng curl hay Postman, bỏ qua toàn bộ giao diện của bạn.</p>
<p>Cần kiểm tra: kiểu dữ liệu, trường bắt buộc, độ dài, khoảng giá trị, định dạng, và <em>quan hệ giữa các trường</em> (ngày kết thúc phải sau ngày bắt đầu).</p>
<pre><code>// Node — Zod
const CreateOrder = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
  note: z.string().max(500).optional(),
});</code></pre>
<pre><code>// C# — Data Annotations
public record CreateOrderDto(
    [Required] int ProductId,
    [Range(1, 100)] int Quantity);</code></pre>
<p class="callout">Một quy tắc dễ quên: từ chối cả những trường <em>thừa</em>. Nếu client gửi kèm <code>{"isAdmin": true}</code> và bạn dùng model binding tự động, trường đó có thể lọt vào entity. Đó là lỗ hổng mass assignment.</p>`,
      check: { type: 'ex', exId: 'node-06' }
    },
    {
      id: 'c7l2', title: 'Xử lý lỗi tập trung',
      body: `
<p>Đừng rải <code>try/catch</code> khắp controller. Đặt một middleware bắt lỗi ở cuối pipeline, chuyển exception thành response có cấu trúc thống nhất.</p>
<pre><code>{
  "type": "validation_error",
  "message": "Dữ liệu không hợp lệ",
  "details": [{ "field": "quantity", "error": "phải lớn hơn 0" }],
  "traceId": "3f2a9c1e"
}</code></pre>
<p>Quy tắc phân loại: lỗi nghiệp vụ dự đoán được → 4xx kèm thông điệp rõ ràng; lỗi ngoài dự kiến → 500 với thông điệp chung, chi tiết chỉ ghi vào log.</p>
<p>Lộ stack trace ra response là rò rỉ thông tin: nó tiết lộ tên thư viện, đường dẫn file, đôi khi cả cấu trúc bảng.</p>
<pre><code>// Express — middleware lỗi có BỐN tham số
app.use((err, req, res, next) =&gt; {
  const status = err.status ?? 500;
  res.status(status).json({ message: status === 500 ? 'Lỗi hệ thống' : err.message });
});</code></pre>
<p>.NET có sẵn chuẩn Problem Details (RFC 7807) qua <code>AddProblemDetails()</code> — nên dùng thay vì tự bịa định dạng.</p>`,
      check: { type: 'ex', exId: 'node-15' }
    },
    {
      id: 'c7l3', title: 'Log có cấu trúc và traceId',
      body: `
<p>Log dạng chuỗi tự do không tìm kiếm được. Log có cấu trúc (JSON) cho phép lọc theo trường:</p>
<pre><code>logger.info({ orderId: 42, userId: 7, durationMs: 128 }, 'order created');</code></pre>
<table><thead><tr><th>Mức</th><th>Dùng khi</th></tr></thead><tbody>
<tr><td>Debug</td><td>Chi tiết khi phát triển</td></tr>
<tr><td>Information</td><td>Sự kiện bình thường: đăng nhập, tạo đơn</td></tr>
<tr><td>Warning</td><td>Bất thường nhưng chưa hỏng</td></tr>
<tr><td>Error</td><td>Thao tác thất bại</td></tr>
<tr><td>Critical</td><td>Hệ thống không phục vụ được</td></tr>
</tbody></table>
<p>Hai thói quen quyết định việc bạn có gỡ được lỗi ở môi trường thật hay không: gắn một <code>traceId</code> vào mọi log của cùng một request, và <strong>tuyệt đối không log mật khẩu, token hay số thẻ</strong>.</p>
<p>Công cụ: Pino hoặc Winston bên Node; Serilog hoặc <code>ILogger</code> sẵn có bên .NET.</p>`,
      check: { type: 'quiz', q: 'Người dùng báo lỗi lúc 14:03 và gửi kèm mã "3f2a9c1e" hiện trên màn hình. Mã này giúp gì?',
        options: ['Nó là mã lỗi chuẩn HTTP', 'Nó là traceId giúp lọc ra đúng chuỗi log của request đó', 'Nó là id người dùng', 'Nó là phiên bản API'],
        answer: 1,
        explain: 'Đó là lý do nên hiển thị traceId cho người dùng khi xảy ra lỗi 500: bạn lọc log theo một chuỗi và thấy toàn bộ hành trình của đúng request đó, thay vì mò trong hàng triệu dòng.' }
    },
    {
      id: 'c7l4', title: 'Health check',
      body: `
<p>Một endpoint <code>GET /health</code> trả về trạng thái ứng dụng và các phụ thuộc. Docker, Kubernetes và dịch vụ deploy dùng nó để biết khi nào được đưa traffic vào, và khi nào nên khởi động lại.</p>
<pre><code>{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "redis": "degraded"
  },
  "uptimeSeconds": 84213
}</code></pre>
<p>Phân biệt hai loại: <strong>liveness</strong> ("tiến trình còn sống không") nên rất nhẹ, và <strong>readiness</strong> ("đã sẵn sàng nhận request chưa") mới kiểm tra database và cache.</p>
<p>Nếu liveness cũng gọi database, một sự cố database ngắn sẽ khiến hệ thống tự khởi động lại liên tục — biến sự cố nhỏ thành sự cố lớn.</p>`,
      check: { type: 'ex', exId: 'node-25' }
    }
  ]
},
{
  id: 'c8', num: 8, title: 'Hiệu năng và mở rộng',
  summary: 'Caching, phân trang, hàng đợi, rate limiting, scale ngang.',
  lessons: [
    {
      id: 'c8l1', title: 'Đo trước, tối ưu sau',
      body: `
<p>Phần lớn chậm chạp đến từ truy vấn thiếu index hoặc N+1, không phải từ ngôn ngữ. Trước khi đổi kiến trúc, hãy trả lời được ba câu:</p>
<ol>
<li>Endpoint nào chậm? (log thời gian phản hồi)</li>
<li>Trong endpoint đó, phần nào tốn thời gian? (đo từng bước)</li>
<li>Nó chậm vì chờ I/O hay vì tính toán?</li>
</ol>
<p>Câu thứ ba quyết định hướng sửa: chờ I/O thì cache hoặc gộp truy vấn; tính toán nặng thì đẩy sang worker hoặc hàng đợi.</p>
<pre><code>const t0 = performance.now();
const rows = await repo.findMany(filter);
logger.info({ ms: Math.round(performance.now() - t0) }, 'query orders');</code></pre>`,
      check: { type: 'quiz', q: 'Endpoint trả danh sách sản phẩm mất 4 giây. Log cho thấy 3.8 giây nằm ở một truy vấn database. Hành động đúng?',
        options: ['Chuyển ứng dụng sang ngôn ngữ nhanh hơn', 'Tăng số bản sao ứng dụng lên gấp đôi', 'Xem execution plan của truy vấn đó và tối ưu index', 'Thêm nhiều worker thread'],
        answer: 2,
        explain: 'Nút thắt nằm ở database. Nhân đôi ứng dụng chỉ gửi gấp đôi truy vấn chậm tới cùng một database, thường làm mọi thứ tệ hơn.' }
    },
    {
      id: 'c8l2', title: 'Caching và bài toán làm mới',
      body: `
<table><thead><tr><th>Lớp cache</th><th>Vị trí</th><th>Phù hợp với</th></tr></thead><tbody>
<tr><td>In-memory</td><td>Trong tiến trình</td><td>Cấu hình, danh mục ít đổi, một server</td></tr>
<tr><td>Redis</td><td>Dịch vụ riêng</td><td>Chia sẻ nhiều server, session, rate limit</td></tr>
<tr><td>HTTP cache</td><td>Header ETag, Cache-Control</td><td>Tài nguyên tĩnh, GET công khai</td></tr>
</tbody></table>
<p>Phần khó không phải lưu, mà là <strong>làm mới</strong>. Hai chiến lược thực dụng:</p>
<ul>
<li><strong>TTL ngắn</strong> — chấp nhận dữ liệu cũ vài giây, đơn giản và đủ dùng cho hầu hết trường hợp.</li>
<li><strong>Xoá khi ghi</strong> — mỗi lần cập nhật sản phẩm thì xoá key cache của sản phẩm đó.</li>
</ul>
<p class="callout">Đừng cache dữ liệu riêng tư theo key chung. Cache trang "giỏ hàng của tôi" dưới key <code>cart</code> sẽ cho người này thấy giỏ hàng của người kia — lỗi nghiêm trọng và rất hay xảy ra.</p>`,
      check: { type: 'ex', exId: 'node-16' }
    },
    {
      id: 'c8l3', title: 'Phân trang',
      body: `
<p>Hai kiểu, mỗi kiểu có chỗ dùng riêng:</p>
<ul>
<li><strong>Offset</strong> — <code>?page=3&amp;size=20</code>. Dễ làm, hiện được "trang 3/50", nhưng chậm dần khi trang ở sâu vì database vẫn phải đếm qua các dòng bị bỏ.</li>
<li><strong>Cursor</strong> — <code>?after=&lt;id cuối&gt;&amp;size=20</code>. Nhanh ổn định, không bị nhảy dòng khi có bản ghi mới chèn vào, hợp với cuộn vô tận.</li>
</ul>
<p>Luôn đặt giới hạn tối đa cho <code>size</code>. Nếu không, ai đó sẽ gọi <code>?size=1000000</code> và làm sập server — dù vô tình hay cố ý.</p>
<pre><code>const size = Math.min(Math.max(Number(req.query.size) || 20, 1), 100);</code></pre>
<p>Response nên kèm metadata để client biết còn dữ liệu hay không: <code>{ items, page, size, total, hasNext }</code>.</p>`,
      check: { type: 'ex', exId: 'node-03' }
    },
    {
      id: 'c8l4', title: 'Hàng đợi và công việc nền',
      body: `
<p>Việc chậm — gửi email, xuất báo cáo, xử lý ảnh — không nên làm trong request. Đẩy vào hàng đợi và trả về <code>202 Accepted</code> kèm một id để client tra trạng thái.</p>
<pre class="mermaid">
flowchart LR
  A[API] --&gt;|đẩy job| B[(Queue)]
  B --&gt; C[Worker]
  C --&gt; D[(Database)]
  C --&gt; E[Email service]
</pre>
<p>Công cụ: BullMQ bên Node; Hangfire hoặc <code>BackgroundService</code> bên .NET.</p>
<p>Hai điều phải thiết kế ngay từ đầu: job phải <strong>idempotent</strong> (hàng đợi có thể giao lại cùng một job), và phải có chỗ cho job thất bại (dead-letter queue) thay vì im lặng biến mất.</p>`,
      check: { type: 'ex', exId: 'node-18' }
    },
    {
      id: 'c8l5', title: 'Rate limiting và scale ngang',
      body: `
<p><strong>Rate limiting</strong> giới hạn số request mỗi IP hoặc mỗi user trong một khoảng thời gian, trả <code>429 Too Many Requests</code> khi vượt. Bắt buộc cho endpoint đăng nhập, quên mật khẩu và gửi OTP — nếu không, dò mật khẩu chỉ là vấn đề thời gian.</p>
<p><strong>Scale dọc</strong> là mua máy mạnh hơn: đơn giản, nhưng có trần. <strong>Scale ngang</strong> là chạy nhiều bản sao sau load balancer: không có trần, nhưng yêu cầu ứng dụng phải stateless.</p>
<p>Ba thứ phá vỡ stateless, cần chuyển ra ngoài trước khi scale ngang:</p>
<ul>
<li>Session lưu trong RAM → chuyển sang Redis</li>
<li>File upload lưu trên đĩa cục bộ → chuyển sang object storage</li>
<li>Cron job chạy trong ứng dụng → tách thành worker riêng, nếu không 5 bản sao sẽ gửi 5 email</li>
</ul>`,
      check: { type: 'ex', exId: 'node-17' }
    }
  ]
},
{
  id: 'c9', num: 9, title: 'Kiểm thử',
  summary: 'Unit, integration, end-to-end; mock; test database; điều nên và không nên test.',
  lessons: [
    {
      id: 'c9l1', title: 'Ba tầng test',
      body: `
<table><thead><tr><th>Loại</th><th>Kiểm tra</th><th>Tốc độ</th><th>Số lượng</th></tr></thead><tbody>
<tr><td>Unit</td><td>Một hàm/lớp, phụ thuộc được mock</td><td>Mili giây</td><td>Nhiều nhất</td></tr>
<tr><td>Integration</td><td>Nhiều thành phần thật, có database</td><td>Giây</td><td>Vừa phải</td></tr>
<tr><td>End-to-end</td><td>Toàn bộ luồng qua HTTP</td><td>Chậm</td><td>Ít, cho luồng quan trọng</td></tr>
</tbody></table>
<p>Mọi test đều theo cấu trúc <strong>Arrange – Act – Assert</strong>: chuẩn bị dữ liệu, gọi hàm, kiểm chứng kết quả. Giữ ba phần tách bạch giúp người đọc hiểu test trong 5 giây.</p>
<pre><code>test('đơn dưới 50k không được giảm giá', () =&gt; {
  const order = { total: 40000 };            // Arrange
  const result = applyDiscount(order);       // Act
  expect(result.discount).toBe(0);           // Assert
});</code></pre>`,
      check: { type: 'quiz', q: 'Bạn muốn kiểm tra rằng POST /api/orders trả 401 khi thiếu token. Đây là loại test nào?',
        options: ['Unit test cho hàm tính giá', 'Integration test qua HTTP với Supertest hoặc WebApplicationFactory', 'Test hiệu năng', 'Không cần test vì đó là việc của framework'],
        answer: 1,
        explain: 'Hành vi này xuất hiện từ sự phối hợp giữa routing và middleware auth, nên phải gọi thật qua HTTP mới kiểm chứng được. Unit test cho service sẽ không chạm tới nó.' }
    },
    {
      id: 'c9l2', title: 'Mock đúng chỗ',
      body: `
<p>Mock những phụ thuộc <em>bên ngoài tầm kiểm soát</em>: cổng thanh toán, dịch vụ email, API bên thứ ba. Không gọi thật trong test — chậm, tốn tiền, và có ngày họ đổi API.</p>
<pre><code>const fakeRepo = { findById: async (id) =&gt; ({ id, total: 40000 }) };
const service = new OrderService(fakeRepo);</code></pre>
<p>Ngược lại, <strong>đừng mock ORM</strong>. Test sẽ xanh nhưng không chứng minh được gì: bạn chỉ đang kiểm tra rằng bản giả của mình trả về đúng thứ mình đã bảo nó trả về. Với repository, hãy dùng database thật trong integration test.</p>
<p>Với database test: Docker (Testcontainers) hoặc một database riêng cho test, reset dữ liệu trước mỗi lần chạy. Dùng chung database với môi trường phát triển là công thức cho những test lúc xanh lúc đỏ.</p>`,
      check: { type: 'quiz', q: 'Test nào dưới đây gần như vô giá trị?',
        options: ['Test service với repository giả để kiểm tra quy tắc giảm giá', 'Test repository với database thật', 'Test rằng repository gọi đúng phương thức của ORM đã bị mock', 'Test endpoint trả 404 khi id không tồn tại'],
        answer: 2,
        explain: 'Test đó chỉ khẳng định lại chính cách bạn viết code, và sẽ đỏ mỗi khi bạn refactor dù hành vi không đổi. Hãy test hành vi quan sát được, không test chi tiết cài đặt.' }
    },
    {
      id: 'c9l3', title: 'Test cái gì trước',
      body: `
<p>Độ phủ 100% không phải mục tiêu. Thứ tự ưu tiên thực tế:</p>
<ol>
<li><strong>Quy tắc nghiệp vụ</strong> — chỗ tiền bạc và logic phức tạp nằm.</li>
<li><strong>Trường hợp biên và lỗi</strong> — số 0, mảng rỗng, quyền thiếu. Bug sống ở đây.</li>
<li><strong>Luồng quan trọng nhất</strong> — đăng nhập, đặt hàng, thanh toán.</li>
</ol>
<p>Thứ không đáng test: getter/setter, code chỉ gọi thẳng framework, và cấu hình.</p>
<p class="callout">Thói quen đáng giá nhất: mỗi lần sửa một bug, viết trước một test tái hiện bug đó. Test đỏ, sửa code, test xanh. Bug đó sẽ không quay lại lần nữa.</p>`,
      check: { type: 'ex', exId: 'node-19' }
    }
  ]
},
{
  id: 'c10', num: 10, title: 'Triển khai',
  summary: 'Cấu hình, biến môi trường, Docker, CI/CD, chạy thật.',
  lessons: [
    {
      id: 'c10l1', title: 'Cấu hình và secret',
      body: `
<p>Mọi thứ khác nhau giữa máy cá nhân và máy chủ — chuỗi kết nối, secret, URL — phải nằm ngoài code.</p>
<ul>
<li>Node: file <code>.env</code> + <code>process.env</code>. Commit <code>.env.example</code>, không commit <code>.env</code>.</li>
<li>.NET: <code>appsettings.json</code> + <code>appsettings.Production.json</code>, secret dùng User Secrets khi phát triển và biến môi trường khi chạy thật.</li>
</ul>
<pre><code># .env.example — commit file này
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=doi-gia-tri-nay
PORT=3000</code></pre>
<p>Nếu đã trót commit secret vào git, đổi secret là việc bắt buộc — xoá khỏi lịch sử git không đủ, vì bản sao đã nằm ở mọi nơi ai đó từng clone.</p>
<p class="callout">Ứng dụng nên <em>dừng ngay khi khởi động</em> nếu thiếu biến môi trường bắt buộc. Chết sớm với thông báo rõ ràng tốt hơn chạy được rồi hỏng lúc nửa đêm.</p>`,
      check: { type: 'ex', exId: 'node-22' }
    },
    {
      id: 'c10l2', title: 'Docker',
      body: `
<p>Docker đóng gói ứng dụng cùng môi trường chạy, để "chạy được trên máy tôi" không còn là vấn đề.</p>
<pre><code>FROM node:26-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]</code></pre>
<p>Thứ tự các dòng không tuỳ tiện: copy <code>package*.json</code> và cài đặt <em>trước</em> khi copy mã nguồn, để Docker dùng lại lớp cache khi bạn chỉ sửa code. Đảo lại là mỗi lần build đều cài lại toàn bộ dependency.</p>
<p><code>docker compose</code> chạy cùng lúc ứng dụng + database + Redis bằng một lệnh — rất đáng học sớm vì nó giải quyết luôn việc dựng môi trường cho người mới vào dự án.</p>`,
      check: { type: 'quiz', q: 'Vì sao Dockerfile nên copy package.json và chạy npm ci trước khi copy toàn bộ mã nguồn?',
        options: ['Vì npm yêu cầu như vậy', 'Để tận dụng cache lớp: sửa code không phải cài lại dependency', 'Để giảm kích thước image xuống một nửa', 'Vì thứ tự không quan trọng, chỉ là thói quen'],
        answer: 1,
        explain: 'Docker cache theo từng lớp và huỷ cache từ lớp đầu tiên thay đổi trở đi. Dependency đổi hiếm hơn code, nên đặt nó ở lớp trước giúp build sau chỉ mất vài giây.' }
    },
    {
      id: 'c10l3', title: 'CI/CD và chạy thật',
      body: `
<pre class="mermaid">
flowchart LR
  A[Push code] --&gt; B[Build]
  B --&gt; C[Chạy test]
  C --&gt; D[Docker image]
  D --&gt; E[Staging]
  E --&gt; F[Production]
</pre>
<p>Hai nguyên tắc: test không qua thì không deploy, và mỗi lần deploy phải quay lại được phiên bản trước.</p>
<table><thead><tr><th>Thành phần</th><th>Vai trò</th></tr></thead><tbody>
<tr><td>Reverse proxy</td><td>HTTPS, nén, file tĩnh</td></tr>
<tr><td>Process manager</td><td>Tự khởi động lại khi sập</td></tr>
<tr><td>Migration</td><td>Chạy tự động trước khi đưa traffic vào</td></tr>
<tr><td>Monitoring</td><td>Uptime, lỗi, thời gian phản hồi</td></tr>
</tbody></table>
<p>Nơi deploy cho người mới: Render, Railway, Fly.io, hoặc Azure App Service (rất hợp với ASP.NET Core). VPS rẻ hơn nhưng bạn phải tự lo mọi thứ ở bảng trên.</p>
<p class="callout">Migration phá vỡ tương thích (đổi tên cột) cần hai bước deploy: thêm cột mới và ghi cả hai chỗ, deploy, rồi mới bỏ cột cũ. Làm một bước sẽ có vài giây code cũ gặp schema mới.</p>`,
      check: { type: 'quiz', q: 'Pipeline CI nên làm gì khi test thất bại ở nhánh main?',
        options: ['Vẫn deploy nhưng gửi cảnh báo', 'Dừng pipeline, không tạo image, không deploy', 'Bỏ qua test đó và chạy lại', 'Deploy lên production để kiểm tra thực tế'],
        answer: 1,
        explain: 'Giá trị duy nhất của CI là nó chặn được thứ hỏng. Một pipeline vẫn deploy khi test đỏ chỉ là trang trí — và sẽ dạy cả nhóm thói quen bỏ qua cảnh báo.' }
    }
  ]
}
];
