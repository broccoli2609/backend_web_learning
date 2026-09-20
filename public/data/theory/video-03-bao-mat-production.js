/* Lý thuyết — mật khẩu, JWT, bảo vệ route, PostgreSQL với Prisma và Docker.
 * Tương ứng phần cuối chương 3 và toàn bộ chương 4 của khoá "Backend Full Course". */

export default [
{
  id: 'n7', title: 'Mật khẩu và bcrypt',
  summary: 'Băm một chiều, salt, cost, và vì sao thông báo đăng nhập sai nên mơ hồ.',
  lessons: [
    {
      id: 'n7l1', title: 'Không bao giờ lưu mật khẩu thô',
      body: `
<p>Đây là quy tắc không có ngoại lệ: <strong>database của bạn không bao giờ được chứa mật khẩu đọc được</strong>. Không phải vì bạn không đáng tin, mà vì bạn không kiểm soát được mọi đường rò: một bản sao lưu để nhầm chỗ, một truy vấn ghi ra log, một lập trình viên cũ còn quyền truy cập.</p>
<p>Giải pháp là <strong>băm một chiều</strong>. Trong <code>authRoutes.js</code> của khoá học, toàn bộ việc đó gọn trong một dòng:</p>
<pre><code>const hashedPassword = bcrypt.hashSync(password, 8)</code></pre>
<p>Ba ý tưởng nằm sau dòng đó:</p>
<table><thead><tr><th>Ý tưởng</th><th>Chống được gì</th></tr></thead><tbody>
<tr><td><strong>Một chiều</strong> — từ chuỗi băm không quay ngược ra mật khẩu</td><td>Database bị lộ thì mật khẩu vẫn an toàn</td></tr>
<tr><td><strong>Salt</strong> — chuỗi ngẫu nhiên riêng cho mỗi người, ghép vào trước khi băm</td><td>Bảng tra sẵn (rainbow table); hai người cùng mật khẩu cho hai chuỗi băm khác nhau</td></tr>
<tr><td><strong>Cost</strong> — số vòng lặp, chính là số 8 ở trên</td><td>Dò mật khẩu hàng loạt; tăng cost lên 1 là kẻ tấn công chậm đi gấp đôi</td></tr>
</tbody></table>
<p>Vì sao phải cố ý làm chậm? Vì MD5 và SHA-1 chạy hàng tỷ phép mỗi giây trên một card đồ hoạ — dò hết mọi mật khẩu tám ký tự chỉ mất vài giờ. bcrypt với cost 8 mất khoảng vài chục mili giây cho <em>một</em> lần băm. Bạn không cảm thấy gì khi đăng nhập; kẻ tấn công thì chậm đi hàng triệu lần.</p>
<p class="callout">Chuỗi bcrypt sinh ra trông như <code>$2a$08$N9qo8uLOickgx2ZMRZoMye...</code>: gói cả thuật toán, cost và salt vào chính chuỗi băm. Nhờ vậy sau này bạn nâng cost lên 12, những mật khẩu cũ vẫn kiểm tra được bằng đúng tham số đã dùng khi tạo.</p>`,
      check: { type: 'ex', exId: 'node-57' }
    },
    {
      id: 'n7l2', title: 'Kiểm tra mật khẩu khi đăng nhập',
      body: `
<p>Mật khẩu đã băm một chiều, nên lúc đăng nhập server <strong>không giải ngược được</strong>. Nó làm điều ngược lại:</p>
<pre><code>const user = getUser.get(username)
if (!user) { return res.status(404).send({ message: "User not found" }) }

const passwordIsValid = bcrypt.compareSync(password, user.password)
if (!passwordIsValid) { return res.status(401).send({ message: "Invalid password" }) }</code></pre>
<p><code>compareSync</code> đọc salt và cost từ chính chuỗi băm đã lưu, băm lại mật khẩu vừa nhập bằng đúng tham số đó, rồi so hai chuỗi băm. Đó là lý do salt phải nằm trong chuỗi lưu xuống — không có nó thì không tái tạo được.</p>
<p>Hai điều đáng lưu ý về đoạn code trên:</p>
<ul>
<li><strong>Luôn dùng <code>compare</code> của thư viện</strong>, đừng tự băm rồi so bằng <code>===</code>. Phép so sánh chuỗi thông thường dừng ngay ở ký tự đầu tiên khác nhau, nên thời gian chạy tiết lộ số ký tự đã đoán đúng. Thư viện dùng phép so sánh có thời gian không đổi.</li>
<li><strong>Hai thông báo lỗi khác nhau là một vấn đề</strong> — bài học tiếp theo nói kỹ.</li>
</ul>
<p>Còn một chi tiết về hiệu năng: <code>hashSync</code> và <code>compareSync</code> là đồng bộ, mà bcrypt thì cố ý chậm. Trong Node, một lời gọi đồng bộ mất 80ms <strong>chặn toàn bộ event loop</strong> — mọi request khác phải xếp hàng chờ. Với ứng dụng học thì không sao; với ứng dụng thật, dùng bản bất đồng bộ <code>bcrypt.hash(...)</code> và <code>bcrypt.compare(...)</code>.</p>`,
      check: { type: 'ex', exId: 'node-58' }
    },
    {
      id: 'n7l3', title: 'Thông báo lỗi nên mơ hồ',
      body: `
<p>Đoạn code ở bài trước trả hai thông báo khác nhau: <em>"User not found"</em> khi không có tài khoản, <em>"Invalid password"</em> khi sai mật khẩu. Hợp lý với người dùng — nhưng nó vừa biến trang đăng nhập thành công cụ dò danh sách người dùng.</p>
<p>Kẻ xấu đưa vào một danh sách mười nghìn email và xem server trả gì:</p>
<table><thead><tr><th>Phản hồi</th><th>Suy ra</th></tr></thead><tbody>
<tr><td>404 · "User not found"</td><td>Email này chưa đăng ký — bỏ qua</td></tr>
<tr><td>401 · "Invalid password"</td><td><strong>Email này có tài khoản</strong> — giữ lại</td></tr>
</tbody></table>
<p>Sau một buổi, họ có danh sách người dùng thật của bạn. Danh sách đó dùng để dò mật khẩu tập trung, để gửi email lừa đảo mạo danh dịch vụ của bạn, hoặc đem bán.</p>
<p>Cách sửa đơn giản đến mức khó tin: <strong>trả cùng một câu, cùng một status code, cho cả hai trường hợp</strong>.</p>
<pre><code>// cả hai nhánh
return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' })</code></pre>
<p>Nguyên tắc chung gọi là <em>account enumeration</em>, và nó áp dụng cho mọi luồng liên quan tới tài khoản:</p>
<ul>
<li><strong>Đăng ký</strong> — "email đã tồn tại" cũng tiết lộ đúng thông tin đó. Cách kín đáo hơn: luôn trả "đã gửi email xác nhận", và email gửi đi sẽ khác nhau tuỳ tình huống.</li>
<li><strong>Quên mật khẩu</strong> — luôn trả "nếu email tồn tại, chúng tôi đã gửi hướng dẫn".</li>
</ul>
<p class="callout">Đây là một trong những đánh đổi kinh điển giữa trải nghiệm và bảo mật. Với ứng dụng nội bộ vài chục người, thông báo rõ ràng có khi hợp lý hơn. Điều quan trọng là bạn <em>biết</em> mình đang đánh đổi, thay vì để nó xảy ra do vô tình.</p>`,
      check: { type: 'ex', exId: 'node-59' }
    }
  ]
},
{
  id: 'n8', title: 'JWT — token thay cho session',
  summary: 'Ba phần của token, chữ ký, thời hạn, và nên lưu token ở đâu.',
  lessons: [
    {
      id: 'n8l1', title: 'Ba phần của một token',
      body: `
<p>Đăng nhập xong, server trả về một chuỗi dài loằng ngoằng:</p>
<pre><code>const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
res.json({ token })</code></pre>
<p>Chuỗi đó là <strong>JWT</strong> — JSON Web Token — và nó gồm ba phần ghép bằng dấu chấm:</p>
<pre>eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOjd9 . 4f2a8b91c7...
       header             payload       signature
  thuật toán ký          dữ liệu        chữ ký</pre>
<p>Điều khiến nhiều người bất ngờ: <strong>header và payload chỉ được mã base64url, không hề mã hoá</strong>. Dán token vào jwt.io là đọc được toàn bộ nội dung. Không cần khoá bí mật nào cả.</p>
<p>Vậy chữ ký dùng để làm gì? <strong>Chống sửa, không phải để giấu.</strong> Ai đó đổi <code>"role":"user"</code> thành <code>"role":"admin"</code> thì chữ ký không còn khớp, và server từ chối ngay. Nhưng họ vẫn đọc được mọi thứ.</p>
<p>Hệ quả trực tiếp: <strong>đừng bao giờ đặt dữ liệu nhạy cảm vào payload</strong> — không mật khẩu, không số thẻ, không thông tin cá nhân. Payload chỉ nên chứa những gì đủ để nhận ra người dùng.</p>
<p>So với session truyền thống:</p>
<table><thead><tr><th></th><th>Session</th><th>JWT</th></tr></thead><tbody>
<tr><td>Trạng thái lưu ở</td><td>Server (bộ nhớ hoặc Redis)</td><td>Chính token, phía client</td></tr>
<tr><td>Thu hồi ngay</td><td>Được — xoá session là xong</td><td><strong>Không</strong> — token còn hạn là còn dùng được</td></tr>
<tr><td>Chạy nhiều bản sao server</td><td>Cần kho session dùng chung</td><td>Không cần gì thêm</td></tr>
<tr><td>Mỗi request tốn</td><td>Một lần tra kho session</td><td>Một phép kiểm tra chữ ký</td></tr>
</tbody></table>
<p class="warn">Dòng "không thu hồi ngay được" là nhược điểm thật, không phải chi tiết nhỏ. Người dùng bấm đăng xuất, nhưng token trong tay kẻ đã lấy được vẫn dùng được tới khi hết hạn. Đây là lý do access token nên sống ngắn.</p>`,
      check: { type: 'ex', exId: 'node-60' }
    },
    {
      id: 'n8l2', title: 'Ký và xác minh',
      body: `
<p>Chữ ký được tính từ ba thứ: header, payload, và <strong>khoá bí mật chỉ server biết</strong>.</p>
<pre>signature = HMAC-SHA256( base64url(header) + "." + base64url(payload), JWT_SECRET )</pre>
<p>Khi token quay lại, server làm lại đúng phép tính đó với payload nhận được, rồi so kết quả với chữ ký đính kèm. Khớp nghĩa là token do chính server này cấp và chưa bị sửa một ký tự nào.</p>
<p>Thứ tự kiểm tra trong <code>jwt.verify</code>:</p>
<ol>
<li>Tách ba phần — không đủ thì token hỏng</li>
<li><strong>Kiểm tra chữ ký</strong> — sai thì dừng ngay tại đây</li>
<li>Kiểm tra <code>exp</code> — quá hạn thì từ chối</li>
<li>Kiểm tra <code>nbf</code>, <code>iss</code>, <code>aud</code> nếu có cấu hình</li>
</ol>
<p>Chữ ký phải được kiểm <em>trước</em> mọi thứ khác. Đọc <code>exp</code> rồi mới xác minh nghĩa là trong khoảng đó bạn đang tin vào dữ liệu chưa xác thực — với một hàm nhỏ thì chưa hại gì, nhưng thói quen "chưa xác minh thì chưa tin" là thứ giữ bạn an toàn khi hệ thống lớn lên.</p>
<p>Về khoá bí mật, ba điều bắt buộc:</p>
<ul>
<li><strong>Đủ dài và ngẫu nhiên.</strong> <code>"secret"</code> hay <code>"your_jwt_secret_here"</code> dò ra trong vài giây, và khi đó ai cũng tự ký được token nói mình là admin.</li>
<li><strong>Lấy từ biến môi trường</strong>, không viết cứng trong code.</li>
<li><strong>Khác nhau giữa các môi trường.</strong> Khoá của bản thử nghiệm bị lộ không được phép mở cửa cho bản chạy thật.</li>
</ul>
<p class="warn">Có một lớp tấn công nhắm vào trường <code>alg</code> trong header: kẻ tấn công đổi nó thành <code>"none"</code> và bỏ luôn chữ ký. Thư viện cũ viết cẩu thả sẽ chấp nhận. Hãy luôn khai rõ thuật toán khi xác minh — <code>jwt.verify(token, secret, { algorithms: ['HS256'] })</code> — thay vì để thư viện tin vào thuật toán mà chính token tự khai.</p>`,
      check: { type: 'ex', exId: 'node-61' }
    },
    {
      id: 'n8l3', title: 'Nên nhét gì vào payload',
      body: `
<p>Payload là nơi rất dễ nhét thêm cho tiện — và mỗi thứ nhét vào đều có giá.</p>
<p>Các trường chuẩn của JWT đều viết tắt ba chữ cái:</p>
<table><thead><tr><th>Trường</th><th>Nghĩa</th><th>Ghi chú</th></tr></thead><tbody>
<tr><td><code>sub</code></td><td>subject — token này nói về ai</td><td>Thường là id người dùng, dạng chuỗi</td></tr>
<tr><td><code>iat</code></td><td>issued at — cấp lúc nào</td><td>Giây, không phải mili giây</td></tr>
<tr><td><code>exp</code></td><td>expires — hết hạn lúc nào</td><td>Giây</td></tr>
<tr><td><code>nbf</code></td><td>not before — trước lúc này chưa dùng được</td><td>Ít dùng</td></tr>
<tr><td><code>iss</code> / <code>aud</code></td><td>ai cấp / cấp cho ai</td><td>Quan trọng khi có nhiều dịch vụ</td></tr>
</tbody></table>
<p>Ngoài ra bạn thêm được trường tuỳ ý: <code>username</code>, <code>roles</code>. Hai câu hỏi trước khi thêm bất cứ gì:</p>
<ol>
<li><strong>Có phiền không nếu ai cũng đọc được?</strong> Payload không mã hoá. Email, số điện thoại, hạng thành viên — cân nhắc kỹ.</li>
<li><strong>Có phiền không nếu nó cũ đi?</strong> Token sống 24 giờ, nên dữ liệu trong đó cũng cũ tới 24 giờ. Bạn gỡ quyền admin của ai đó, nhưng token họ đang cầm vẫn ghi <code>roles: ['admin']</code>.</li>
</ol>
<p>Câu hỏi thứ hai dẫn tới cách làm phổ biến: <strong>access token sống ngắn, refresh token sống dài</strong>.</p>
<table><thead><tr><th></th><th>Access token</th><th>Refresh token</th></tr></thead><tbody>
<tr><td>Sống</td><td>15 phút tới 1 giờ</td><td>7 tới 30 ngày</td></tr>
<tr><td>Gửi kèm</td><td>Mọi request</td><td>Chỉ khi xin token mới</td></tr>
<tr><td>Lưu ở</td><td>Bộ nhớ ứng dụng</td><td>Cookie HttpOnly</td></tr>
<tr><td>Thu hồi</td><td>Chờ hết hạn</td><td>Xoá khỏi database là xong</td></tr>
</tbody></table>
<p>Cách này lấy lại được phần lớn khả năng thu hồi mà JWT đánh mất: refresh token có lưu ở server nên xoá được, còn access token thì hết hạn nhanh tới mức thiệt hại bị giới hạn.</p>`,
      check: { type: 'ex', exId: 'node-62' }
    },
    {
      id: 'n8l4', title: 'Lưu token ở đâu trên client',
      body: `
<p>Server trả token về rồi, frontend cất nó ở đâu? Không có lựa chọn nào hoàn hảo, và mỗi lựa chọn hở một hướng khác nhau.</p>
<table><thead><tr><th>Nơi lưu</th><th>Điểm mạnh</th><th>Điểm yếu</th></tr></thead><tbody>
<tr><td><code>localStorage</code></td><td>Đơn giản, sống qua lần đóng tab</td><td>JavaScript đọc được → một lỗ hổng <strong>XSS</strong> là mất token</td></tr>
<tr><td>Cookie thường</td><td>Trình duyệt tự gửi kèm</td><td>JavaScript vẫn đọc được, lại thêm nguy cơ <strong>CSRF</strong></td></tr>
<tr><td>Cookie <code>HttpOnly</code></td><td>JavaScript <strong>không</strong> đọc được, XSS không lấy được</td><td>Cần chống CSRF bằng <code>SameSite</code>; cấu hình phức tạp hơn</td></tr>
<tr><td>Biến trong bộ nhớ</td><td>An toàn nhất</td><td>Tải lại trang là mất, phải đăng nhập lại</td></tr>
</tbody></table>
<p>Hai lỗ hổng được nhắc tới ở trên:</p>
<ul>
<li><strong>XSS</strong> — kẻ tấn công chèn được JavaScript vào trang của bạn. Khi đó mọi thứ JavaScript đọc được đều mất, kể cả <code>localStorage</code>.</li>
<li><strong>CSRF</strong> — một trang khác lừa trình duyệt người dùng gửi request tới API của bạn. Vì trình duyệt tự đính cookie, request đó trông như thật. Chống bằng <code>SameSite=Strict</code> hoặc <code>Lax</code>.</li>
</ul>
<p>Cách được khuyến nghị hiện nay: <strong>access token giữ trong bộ nhớ, refresh token trong cookie HttpOnly + SameSite</strong>. Tải lại trang thì ứng dụng dùng refresh token lấy access token mới — người dùng không thấy gì, mà XSS cũng không lấy được gì đáng giá.</p>
<p class="callout">Khoá học dùng <code>localStorage</code> cho gọn, và với một ứng dụng todo để học thì hoàn toàn chấp nhận được. Nhưng hãy biết đó là một đánh đổi có chủ đích, để khi làm sản phẩm thật bạn chọn lại cho đúng.</p>`,
      check: { type: 'quiz', q: 'Ứng dụng của bạn lưu JWT trong localStorage. Một thư viện bên thứ ba bạn nhúng vào trang bị chèn mã độc. Hậu quả nặng nhất là gì?',
        options: ['Không sao, vì token đã được ký nên không sửa được',
          'Mã độc đọc được token từ localStorage và giả danh người dùng cho tới khi token hết hạn',
          'Chỉ giao diện bị ảnh hưởng, dữ liệu vẫn an toàn',
          'Trình duyệt tự động chặn vì khác origin'],
        answer: 1,
        explain: 'Mã chạy trong trang của bạn là cùng origin, nên đọc localStorage thoải mái. Nó không cần sửa token — chỉ cần đem token đi dùng. Cookie HttpOnly chặn được đúng kịch bản này, vì JavaScript không đọc được cookie loại đó.' }
    }
  ]
},
{
  id: 'n9', title: 'Bảo vệ route bằng middleware',
  summary: 'Đọc token, chặn đúng chỗ, và vì sao xác thực xong vẫn chưa đủ an toàn.',
  lessons: [
    {
      id: 'n9l1', title: 'Đọc token từ header Authorization',
      body: `
<p>Token đi kèm request ở header <code>Authorization</code>. Chuẩn HTTP quy định dạng:</p>
<pre>Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...</pre>
<p>Chữ <code>Bearer</code> nghĩa là "người mang" — ai cầm token này thì được coi là chủ nhân, không cần chứng minh gì thêm. Nghe đáng lo, và đúng là đáng lo: đó chính là lý do token phải đi qua HTTPS và phải sống ngắn.</p>
<p><code>authMiddleware.js</code> trong khoá học đọc thẳng:</p>
<pre><code>const token = req.headers['authorization']</code></pre>
<p>Chạy được, vì file <code>.rest</code> của khoá gửi token trần không có tiền tố. Nhưng Postman, các thư viện HTTP, cổng API — gần như mọi công cụ — đều gửi kèm <code>Bearer</code>. Một middleware tốt nên nhận cả hai dạng.</p>
<p>Thêm một chi tiết: <strong>tên header không phân biệt hoa thường</strong>. Node thường đã chuẩn hoá <code>req.headers</code> về chữ thường, nhưng khi bạn tự viết hàm đọc header thì đừng dựa vào điều đó.</p>
<p class="callout">Vì sao không dùng query string cho gọn, kiểu <code>/todos?token=abc</code>? Vì query string bị ghi vào log của server, vào lịch sử trình duyệt, và vào header <code>Referer</code> khi người dùng bấm sang trang khác. Header <code>Authorization</code> thì không đi đâu cả.</p>`,
      check: { type: 'ex', exId: 'node-63' }
    },
    {
      id: 'n9l2', title: 'authMiddleware hoàn chỉnh',
      body: `
<p>Đây là toàn bộ cơ chế bảo vệ của ứng dụng, gói trong một file:</p>
<pre><code>import jwt from 'jsonwebtoken'

function authMiddleware(req, res, next) {
    const token = req.headers['authorization']
    if (!token) { return res.status(401).json({ message: "No token provided" }) }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) { return res.status(401).json({ message: "Invalid token" }) }
        req.userId = decoded.id
        next()
    })
}

export default authMiddleware</code></pre>
<p>Và cách gắn nó, trong <code>server.js</code>:</p>
<pre><code>app.use('/auth', authRoutes)                   // ai cũng gọi được
app.use('/todos', authMiddleware, todoRoutes)  // phải có token</code></pre>
<p>Hai dòng đó làm được ba việc đáng giá:</p>
<ul>
<li><strong>Không endpoint nào bị quên.</strong> Mọi route trong <code>todoRoutes</code> đều được bảo vệ, kể cả route bạn thêm vào ngày mai.</li>
<li><strong>Route không phải biết gì về token.</strong> Chúng chỉ đọc <code>req.userId</code> — thứ mà middleware đã gắn sẵn.</li>
<li><strong>Chặn là không gọi <code>next()</code>.</strong> Chuỗi dừng, route phía sau không bao giờ chạy.</li>
</ul>
<p>Hai chỗ nên cải thiện so với bản gốc:</p>
<ol>
<li>Phân biệt <strong>token hết hạn</strong> với <strong>token không hợp lệ</strong>. Frontend cần biết khi nào nên tự động xin token mới, khi nào nên bắt đăng nhập lại.</li>
<li>Chấp nhận cả dạng có tiền tố <code>Bearer</code>.</li>
</ol>
<p class="warn">Mọi nhánh từ chối ở đây đều là <strong>401</strong>, không phải 403. 401 nghĩa là "tôi không biết bạn là ai"; 403 nghĩa là "tôi biết bạn là ai, nhưng bạn không được phép". Thiếu token, token hỏng, token hết hạn — cả ba đều thuộc nhóm đầu.</p>`,
      check: { type: 'ex', exId: 'node-64' }
    },
    {
      id: 'n9l3', title: 'Xác thực xong vẫn chưa đủ',
      body: `
<p><code>authMiddleware</code> trả lời câu hỏi <em>"bạn là ai"</em>. Nó <strong>không</strong> trả lời câu <em>"bản ghi này có phải của bạn không"</em>. Quên câu thứ hai là sinh ra lỗ hổng <strong>IDOR</strong>.</p>
<p>Đây là lỗ hổng có thật trong mã nguồn của khoá học:</p>
<pre><code>router.put('/:id', (req, res) => {
    const { completed } = req.body
    const { id } = req.params

    const updatedTodo = db.prepare('UPDATE todos SET completed = ? WHERE id = ?')
    updatedTodo.run(completed, id)     // ← không hỏi todo này thuộc về ai

    res.json({ message: "Todo completed" })
})</code></pre>
<p>Người dùng A đăng nhập hợp lệ, đổi URL từ <code>/todos/2</code> thành <code>/todos/3</code>, và sửa được todo của người dùng B. Middleware không phát hiện được gì cả — A đúng là A, token của A hoàn toàn hợp lệ.</p>
<p>Để ý rằng câu <code>DELETE</code> ngay bên dưới trong cùng file lại làm đúng:</p>
<pre><code>const deleteTodo = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?')</code></pre>
<p>Chỉ khác một mệnh đề <code>AND</code>. Và đó là bản chất của IDOR: nó không phải lỗi kiến trúc, nó là một dòng bị quên.</p>
<p>Ba cách phòng, dùng cùng lúc càng tốt:</p>
<ol>
<li><strong>Đưa điều kiện quyền sở hữu vào chính câu truy vấn.</strong> Mạnh nhất, vì không có đường nào đi vòng qua nó.</li>
<li><strong>Trả 404 thay vì 403</strong> khi bản ghi thuộc về người khác. 403 xác nhận bản ghi có tồn tại; 404 thì không cho biết gì.</li>
<li><strong>Dùng id khó đoán</strong> (UUID thay vì số tăng dần). Đây chỉ là lớp phòng thủ phụ — che giấu không phải bảo vệ, nhưng nó chặn được kiểu dò tuần tự.</li>
</ol>
<p class="callout">Một cách tự kiểm tra: mở mọi câu truy vấn có <code>WHERE id = ?</code> trong dự án và hỏi <em>"nếu id này là của người khác thì sao"</em>. Câu trả lời phải là "không tìm thấy", chứ không phải "sửa được".</p>`,
      check: { type: 'ex', exId: 'node-65' }
    }
  ]
},
{
  id: 'n10', title: 'PostgreSQL và Prisma',
  summary: 'Đổi database, mô tả dữ liệu bằng schema, migration và truy vấn qua ORM.',
  lessons: [
    {
      id: 'n10l1', title: 'Vì sao đổi sang PostgreSQL',
      body: `
<p>SQLite đưa bạn đi rất xa mà không tốn công cài đặt. Nhưng có lúc nó hết đất.</p>
<table><thead><tr><th>Tình huống</th><th>SQLite</th><th>PostgreSQL</th></tr></thead><tbody>
<tr><td>Nhiều người ghi cùng lúc</td><td>Khoá cả file, người sau chờ</td><td>Ghi song song thật</td></tr>
<tr><td>Chạy nhiều bản sao ứng dụng</td><td>Không được — mỗi bản một file riêng</td><td>Mọi bản nối chung một database</td></tr>
<tr><td>Kiểu dữ liệu</td><td>5 kiểu, khá lỏng</td><td>Ngày giờ có múi giờ, JSON, mảng, kiểu tự định nghĩa</td></tr>
<tr><td>Kiểm tra kiểu</td><td>Lỏng — nhét chuỗi vào cột số vẫn được</td><td>Chặt — sai kiểu là báo lỗi</td></tr>
<tr><td>Vận hành</td><td>Sao lưu bằng cách chép file</td><td>Sao lưu, nhân bản, giám sát — có công cụ đầy đủ</td></tr>
</tbody></table>
<p>Dòng thứ hai là dòng quyết định. Ứng dụng backend thường được chạy nhiều bản sau một bộ cân bằng tải — đó là cách bạn phục vụ nhiều người dùng hơn và không chết khi một máy hỏng. SQLite không làm được điều đó, vì database là một file nằm trên đĩa của <em>một</em> máy.</p>
<p>Đổi database kéo theo hai thay đổi trong code:</p>
<ul>
<li>SQL có khác biệt nhỏ giữa hai hệ — <code>AUTOINCREMENT</code> thành <code>SERIAL</code>, hàm ngày giờ khác tên</li>
<li>Kết nối thành bất đồng bộ, nên mọi truy vấn cần <code>await</code></li>
</ul>
<p>Và đây là lúc <strong>ORM</strong> trở nên hấp dẫn: nếu bạn mô tả dữ liệu ở một chỗ và để thư viện sinh SQL, thì đổi database chỉ là đổi một dòng cấu hình.</p>`,
      check: { type: 'quiz', q: 'Ứng dụng của bạn dùng SQLite và đang chạy tốt với 50 người dùng. Sếp yêu cầu chạy 3 bản sao ứng dụng sau load balancer để chịu tải cao hơn. Vấn đề đầu tiên gặp phải là gì?',
        options: ['SQLite chạy chậm hơn PostgreSQL',
          'Mỗi bản sao có file database riêng, nên người dùng thấy dữ liệu khác nhau tuỳ vào bản sao nào nhận request',
          'SQLite không hỗ trợ tiếng Việt',
          'Không có vấn đề gì, SQLite chạy tốt ở mọi quy mô'],
        answer: 1,
        explain: 'Database là một file trên đĩa của một máy. Ba bản sao là ba file riêng biệt, không đồng bộ với nhau. Đặt file lên ổ đĩa chia sẻ cũng không cứu được, vì cơ chế khoá file của SQLite không hoạt động đáng tin trên ổ đĩa mạng.' }
    },
    {
      id: 'n10l2', title: 'ORM và Prisma',
      body: `
<p><strong>ORM</strong> — Object-Relational Mapper — đứng giữa code và database: bạn làm việc với object, nó sinh SQL.</p>
<pre><code>// SQL thô
const getTodos = db.prepare('SELECT * FROM todos WHERE user_id = ?')
const todos = getTodos.all(req.userId)

// Prisma
const todos = await prisma.todo.findMany({
  where: { userId: req.userId }
})</code></pre>
<p>Prisma khác phần lớn ORM ở một điểm: nó <strong>sinh code từ file mô tả</strong>. Bạn viết <code>schema.prisma</code>, chạy <code>npx prisma generate</code>, và nhận được một client biết chính xác các bảng và cột của bạn. Gõ sai tên cột là trình soạn thảo báo đỏ ngay, không cần chạy mới biết.</p>
<table><thead><tr><th>Được</th><th>Mất</th></tr></thead><tbody>
<tr><td>Gợi ý và kiểm tra tên cột ngay lúc gõ</td><td>Thêm một lớp phải học</td></tr>
<tr><td>Tự tham số hoá, không lo SQL injection</td><td>Truy vấn phức tạp diễn đạt khó hơn SQL</td></tr>
<tr><td>Migration có phiên bản, chạy được trên mọi máy</td><td>Dễ vô tình sinh ra truy vấn N+1</td></tr>
<tr><td>Đổi database chỉ là đổi provider</td><td>Khó thấy SQL thật đang chạy là gì</td></tr>
</tbody></table>
<p>Lời khuyên thực tế: <strong>dùng ORM, nhưng đừng thôi học SQL</strong>. Khi truy vấn chậm, bạn vẫn phải đọc được SQL mà ORM sinh ra để hiểu vì sao. Prisma có tuỳ chọn log câu lệnh thật — bật nó lên ở môi trường phát triển là một thói quen tốt.</p>
<p class="warn">ORM tự tham số hoá nên miễn nhiễm với SQL injection ở các truy vấn thông thường. Nhưng cửa sau vẫn mở: <code>prisma.$queryRawUnsafe(...)</code> nối chuỗi như thời xưa. Dùng <code>$queryRaw</code> với template literal có tham số nếu buộc phải viết SQL tay.</p>`,
      check: { type: 'ex', exId: 'node-66' }
    },
    {
      id: 'n10l3', title: 'schema.prisma — một nguồn sự thật',
      body: `
<p>Toàn bộ cấu trúc dữ liệu của ứng dụng nằm trong một file:</p>
<pre><code>generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int    @id @default(autoincrement())
  username  String @unique
  password  String
  todos     Todo[]
}

model Todo {
  id        Int     @id @default(autoincrement())
  task      String
  completed Boolean @default(false)
  userId    Int
  user      User    @relation(fields: [userId], references: [id])
}</code></pre>
<p>Từ file này Prisma sinh ra ba thứ: client JavaScript, các câu lệnh migration SQL, và định nghĩa kiểu cho trình soạn thảo. Mô tả một lần, dùng được cả ba chỗ.</p>
<p>Về quan hệ, có một điểm hay nhầm: <strong>phải khai ở cả hai model</strong>.</p>
<ul>
<li>Bên <code>Todo</code>: <code>userId Int</code> là cột thật trong database, và <code>user User @relation(...)</code> mô tả quan hệ</li>
<li>Bên <code>User</code>: <code>todos Todo[]</code> <strong>không</strong> tạo ra cột nào — nó chỉ để bạn viết được <code>include: { todos: true }</code></li>
</ul>
<p>Thiếu một bên thì <code>prisma generate</code> báo lỗi ngay, nên cái bẫy này không kéo dài lâu.</p>
<p>So sánh nhanh với SQL bạn đã viết ở chương SQLite:</p>
<table><thead><tr><th>SQL</th><th>Prisma</th></tr></thead><tbody>
<tr><td><code>INTEGER PRIMARY KEY AUTOINCREMENT</code></td><td><code>Int @id @default(autoincrement())</code></td></tr>
<tr><td><code>TEXT UNIQUE</code></td><td><code>String @unique</code></td></tr>
<tr><td><code>BOOLEAN DEFAULT 0</code></td><td><code>Boolean @default(false)</code></td></tr>
<tr><td><code>FOREIGN KEY(user_id) REFERENCES users(id)</code></td><td><code>@relation(fields: [userId], references: [id])</code></td></tr>
</tbody></table>
<p>Cùng một ý tưởng, hai cách viết. Biết cả hai thì đọc được mọi dự án.</p>`,
      check: { type: 'ex', exId: 'node-67' }
    },
    {
      id: 'n10l4', title: 'Migration — lịch sử có phiên bản của database',
      body: `
<p>Bạn sửa <code>schema.prisma</code>, thêm một cột. Database thật chưa biết gì về thay đổi đó. Ai sẽ chạy lệnh <code>ALTER TABLE</code>, và trên bao nhiêu máy?</p>
<p><strong>Migration</strong> là câu trả lời: mỗi thay đổi schema sinh ra một file SQL có đánh số thứ tự, được commit cùng code.</p>
<pre><code>npx prisma migrate dev --name them_cot_deadline</code></pre>
<p>Lệnh này làm ba việc: so sánh schema với database, sinh file SQL trong <code>prisma/migrations/</code>, rồi chạy nó. File sinh ra trông như:</p>
<pre><code>-- prisma/migrations/20241121001602_them_cot_deadline/migration.sql
ALTER TABLE "Todo" ADD COLUMN "deadline" TIMESTAMP;</code></pre>
<p>Vì file nằm trong Git, mọi máy và mọi môi trường đều chạy đúng chuỗi thay đổi đó, theo đúng thứ tự.</p>
<table><thead><tr><th>Lệnh</th><th>Dùng khi</th></tr></thead><tbody>
<tr><td><code>prisma migrate dev</code></td><td>Đang phát triển: sinh migration mới và chạy luôn</td></tr>
<tr><td><code>prisma migrate deploy</code></td><td>Chạy thật: chỉ áp dụng migration đã có, không sinh mới</td></tr>
<tr><td><code>prisma generate</code></td><td>Sinh lại client sau khi đổi schema</td></tr>
<tr><td><code>prisma studio</code></td><td>Mở giao diện xem và sửa dữ liệu</td></tr>
</tbody></table>
<p>Ba quy tắc khi làm việc với migration:</p>
<ol>
<li><strong>Không bao giờ sửa file migration đã chạy trên môi trường thật.</strong> Muốn đổi gì thì tạo migration mới.</li>
<li><strong>Đọc file SQL sinh ra trước khi chạy ở môi trường thật.</strong> Đổi tên cột đôi khi bị hiểu thành xoá cột cũ rồi thêm cột mới — và dữ liệu đi theo.</li>
<li><strong>Thay đổi phá vỡ thì chia làm nhiều bước.</strong> Thêm cột mới, chuyển dữ liệu sang, đổi code, rồi mới xoá cột cũ — như vậy ứng dụng không chết trong lúc deploy.</li>
</ol>`,
      check: { type: 'quiz', q: 'Bạn đổi tên cột "task" thành "title" trong schema.prisma rồi chạy prisma migrate dev. Vì sao phải đọc file SQL sinh ra trước khi áp dụng lên môi trường thật?',
        options: ['Vì file SQL có thể chứa lỗi cú pháp',
          'Vì Prisma không biết đây là đổi tên hay xoá cột cũ rồi thêm cột mới — nếu hiểu theo cách thứ hai thì toàn bộ dữ liệu trong cột đó sẽ mất',
          'Vì file SQL cần được dịch sang tiếng Việt',
          'Vì migration chỉ chạy được một lần duy nhất'],
        answer: 1,
        explain: 'Prisma so sánh trạng thái trước và sau, và một cột biến mất cùng một cột mới xuất hiện trông giống hệt việc xoá rồi thêm. Với cột rỗng thì không sao; với bảng đã có dữ liệu thật thì mất sạch. Cách an toàn là tự viết migration đổi tên, hoặc chia thành nhiều bước.' }
    },
    {
      id: 'n10l5', title: 'Truy vấn bằng Prisma Client',
      body: `
<p>So sánh trực tiếp <code>todoRoutes.js</code> hai phiên bản. Cùng một endpoint, cùng một kết quả.</p>
<pre><code>// SQLite — đồng bộ, SQL viết tay
router.post('/', (req, res) => {
    const { task } = req.body
    const insertTodo = db.prepare('INSERT INTO todos (user_id, task) VALUES (?, ?)')
    const result = insertTodo.run(req.userId, task)
    res.json({ id: result.lastInsertRowid, task, completed: 0 })
})

// Prisma — bất đồng bộ, object
router.post('/', async (req, res) => {
    const { task } = req.body
    const todo = await prisma.todo.create({
        data: { task, userId: req.userId }
    })
    res.json(todo)
})</code></pre>
<p>Ba khác biệt đáng chú ý: mọi lời gọi đều <code>await</code>, tên cột theo quy ước JavaScript (<code>userId</code> chứ không phải <code>user_id</code>), và <code>create</code> trả luôn về bản ghi đầy đủ nên không phải tự dựng lại object trả về.</p>
<p>Các phương thức hay dùng:</p>
<table><thead><tr><th>Prisma</th><th>Tương đương SQL</th></tr></thead><tbody>
<tr><td><code>findMany({ where })</code></td><td><code>SELECT * FROM ... WHERE ...</code></td></tr>
<tr><td><code>findUnique({ where: { id } })</code></td><td><code>SELECT ... WHERE id = ?</code> trên cột duy nhất</td></tr>
<tr><td><code>create({ data })</code></td><td><code>INSERT</code></td></tr>
<tr><td><code>update({ where, data })</code></td><td><code>UPDATE</code></td></tr>
<tr><td><code>delete({ where })</code></td><td><code>DELETE</code></td></tr>
<tr><td><code>include: { todos: true }</code></td><td><code>JOIN</code> lấy kèm dữ liệu liên quan</td></tr>
</tbody></table>
<p>Và đây là cái bẫy lớn nhất khi dùng ORM — <strong>truy vấn N+1</strong>:</p>
<pre><code>// SAI: 1 truy vấn lấy user, rồi N truy vấn lấy todo
const users = await prisma.user.findMany()
for (const user of users) {
  user.todos = await prisma.todo.findMany({ where: { userId: user.id } })
}

// ĐÚNG: một truy vấn duy nhất
const users = await prisma.user.findMany({ include: { todos: true } })</code></pre>
<p>Với 100 user, cách đầu chạy 101 lần đi database. Nó không báo lỗi, chỉ chậm — và chậm dần theo số người dùng, nên thường chỉ lộ ra khi đã chạy thật.</p>
<p class="callout">Quy tắc nhận biết: <strong>thấy <code>await</code> nằm trong vòng lặp thì dừng lại và nghĩ</strong>. Gần như lần nào cũng có cách gộp thành một truy vấn.</p>`,
      check: { type: 'ex', exId: 'node-68' }
    }
  ]
},
{
  id: 'n11', title: 'Docker',
  summary: 'Image và container, Dockerfile, layer cache, compose và biến môi trường.',
  lessons: [
    {
      id: 'n11l1', title: 'Image và container',
      body: `
<p>"Máy tôi chạy được" là câu nói mà Docker sinh ra để xoá sổ. Nguyên nhân của câu đó luôn giống nhau: máy bạn có Node 22, máy đồng đội có Node 18; máy bạn có PostgreSQL, máy chủ thì chưa; biến môi trường mỗi nơi một kiểu.</p>
<p>Docker đóng gói tất cả thành một khối. Hai khái niệm cần phân biệt:</p>
<table><thead><tr><th></th><th>Image</th><th>Container</th></tr></thead><tbody>
<tr><td>Là gì</td><td>Bản đóng gói, chỉ đọc</td><td>Một lần chạy của image đó</td></tr>
<tr><td>Ví von</td><td>File cài đặt</td><td>Chương trình đang chạy</td></tr>
<tr><td>Số lượng</td><td>Một</td><td>Chạy bao nhiêu bản cũng được</td></tr>
<tr><td>Trạng thái</td><td>Bất biến</td><td>Có lớp ghi riêng, mất khi xoá container</td></tr>
</tbody></table>
<p>Một image chứa: hệ điều hành tối giản, bộ chạy (Node chẳng hạn), thư viện, code của bạn, và lệnh khởi động. Ai chạy image đó cũng nhận được môi trường y hệt.</p>
<p>Điểm khác với máy ảo: container <strong>dùng chung nhân hệ điều hành</strong> với máy chủ. Không có hệ điều hành khách nào được khởi động, nên container chạy lên trong mili giây và nặng vài chục megabyte, thay vì vài phút và vài gigabyte.</p>
<p>Ba lệnh dùng hằng ngày:</p>
<pre><code>docker compose build     # dựng image từ Dockerfile
docker compose up        # chạy các container
docker compose down      # dừng và xoá container</code></pre>
<p class="warn">Container không giữ dữ liệu. Mọi thứ ghi vào bên trong nó biến mất khi container bị xoá — và <code>docker compose down</code> xoá thật. Đây là lý do database phải gắn <strong>volume</strong>, chuyện sẽ nói ở bài cuối chương.</p>`,
      check: { type: 'quiz', q: 'Bạn chạy docker compose up, đăng ký vài tài khoản, rồi docker compose down và up lại. Dữ liệu mất sạch. Nguyên nhân?',
        options: ['Docker tự xoá dữ liệu sau mỗi lần chạy vì lý do bảo mật',
          'Database ghi vào lớp ghi của container, mà lớp đó bị xoá cùng container — cần gắn volume để dữ liệu nằm ngoài',
          'Vì thiếu lệnh prisma migrate deploy',
          'Vì image được build lại nên code đã thay đổi'],
        answer: 1,
        explain: 'Container có một lớp ghi riêng nằm trên image chỉ đọc, và lớp đó gắn với vòng đời của container. Volume là vùng lưu trữ do Docker quản lý, nằm ngoài container, nên sống sót qua down và up.' }
    },
    {
      id: 'n11l2', title: 'Dockerfile từng dòng',
      body: `
<p><code>Dockerfile</code> là công thức dựng image. Mỗi dòng tạo ra một <strong>layer</strong>, và Docker lưu cache từng layer.</p>
<pre><code># Image nền
FROM node:22-alpine

# Thư mục làm việc bên trong container
WORKDIR /app

# Chép riêng package.json trước
COPY package*.json .

# Cài phụ thuộc
RUN npm install

# Bây giờ mới chép phần code còn lại
COPY . .

# Ghi chú cổng ứng dụng lắng nghe
EXPOSE 5003

# Lệnh chạy khi container khởi động
CMD ["node", "./src/server.js"]</code></pre>
<table><thead><tr><th>Lệnh</th><th>Chạy lúc nào</th><th>Ghi chú</th></tr></thead><tbody>
<tr><td><code>FROM</code></td><td>Build</td><td>Luôn ghi phiên bản cụ thể, đừng dùng <code>latest</code></td></tr>
<tr><td><code>WORKDIR</code></td><td>Build</td><td>Tự tạo thư mục nếu chưa có</td></tr>
<tr><td><code>COPY</code></td><td>Build</td><td>Chép từ máy bạn vào image</td></tr>
<tr><td><code>RUN</code></td><td>Build</td><td>Kết quả được nướng vào image</td></tr>
<tr><td><code>EXPOSE</code></td><td>—</td><td>Chỉ là ghi chú, không tự mở cổng</td></tr>
<tr><td><code>CMD</code></td><td>Khởi động container</td><td>Dạng mảng JSON để tín hiệu dừng tới được tiến trình</td></tr>
</tbody></table>
<p>Vì sao chọn <code>alpine</code>? Vì nó là bản Linux tối giản: image Node đầy đủ nặng khoảng 1GB, bản alpine khoảng 150MB. Nhẹ hơn nghĩa là đẩy lên mạng nhanh hơn, khởi động nhanh hơn, và ít phần mềm thừa hơn để mà có lỗ hổng.</p>
<p>Còn một file nữa nên có: <code>.dockerignore</code>. Nó hoạt động như <code>.gitignore</code>, và tối thiểu phải có <code>node_modules</code> và <code>.env</code> — thư mục <code>node_modules</code> của máy bạn có thể chứa bản biên dịch cho hệ điều hành khác, và chép <code>.env</code> vào image là nướng luôn khoá bí mật vào đó.</p>`,
      check: { type: 'ex', exId: 'node-69' }
    },
    {
      id: 'n11l3', title: 'Layer cache và thứ tự các dòng',
      body: `
<p>Docker cache từng layer, theo một quy tắc nghiêm: <strong>một layer chỉ được dùng lại khi mọi layer phía trên nó cũng được dùng lại</strong>. Hỏng một mắt xích là mọi thứ bên dưới phải làm lại.</p>
<p>Chính vì vậy, thứ tự hai dòng <code>COPY</code> quyết định lần build sau mất ba giây hay ba phút.</p>
<pre><code># THỨ TỰ TỐT
COPY package*.json .     ← chỉ đổi khi thêm bớt thư viện
RUN npm install          ← được dùng lại
COPY . .                 ← đổi mỗi lần sửa code

# THỨ TỰ XẤU
COPY . .                 ← đổi mỗi lần sửa code
RUN npm install          ← phải cài lại từ đầu, mỗi lần</code></pre>
<p>Với thứ tự tốt, sửa một dòng trong <code>server.js</code> thì Docker dùng lại ba layer đầu và chỉ chạy lại <code>COPY . .</code>. Với thứ tự xấu, cùng thay đổi đó bắt cài lại toàn bộ thư viện.</p>
<p>Nguyên tắc chung: <strong>đặt thứ ít thay đổi lên trên, thứ hay thay đổi xuống dưới</strong>. Sắp xếp theo tần suất thay đổi, không phải theo trình tự logic.</p>
<p>Một mẹo nữa cho môi trường thật là <strong>multi-stage build</strong>: dựng ở một tầng có đủ công cụ, rồi chỉ chép kết quả sang một tầng sạch.</p>
<pre><code>FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "./dist/server.js"]</code></pre>
<p>Image cuối không chứa mã nguồn, không chứa công cụ build — nhỏ hơn và ít thứ để tấn công hơn.</p>`,
      check: { type: 'ex', exId: 'node-70' }
    },
    {
      id: 'n11l4', title: 'docker-compose: nhiều container cùng chạy',
      body: `
<p>Ứng dụng cần hai thứ chạy cùng lúc: server Node và PostgreSQL. Chạy tay hai lệnh <code>docker run</code> với đủ tham số mạng là cực hình. <strong>Compose</strong> mô tả cả hai trong một file.</p>
<pre><code>services:
  app:
    build: .
    ports:
      - "5003:5003"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/todoapp
      - JWT_SECRET=doi-chuoi-nay
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: todoapp
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:</code></pre>
<p>Chi tiết quan trọng nhất nằm ở chuỗi kết nối: <code>@db:5432</code>. Chữ <code>db</code> đó không phải tên máy chủ — nó là <strong>tên service</strong> ngay bên dưới.</p>
<p>Compose tạo một mạng riêng cho các service trong file, và mỗi service có tên miền đúng bằng tên của nó. Đây là lý do <code>localhost</code> <em>không</em> dùng được: bên trong container <code>app</code>, <code>localhost</code> trỏ về chính container đó, nơi không có database nào đang chạy.</p>
<p>Về <code>ports: "5003:5003"</code> — số bên trái là cổng trên máy bạn, số bên phải là cổng trong container. Không có dòng này thì container vẫn chạy và vẫn gọi được từ container khác, chỉ là trình duyệt của bạn không với tới.</p>
<p class="warn"><code>depends_on</code> chỉ bảo đảm <strong>thứ tự khởi động</strong>, không bảo đảm PostgreSQL đã sẵn sàng nhận kết nối. Lần <code>docker compose up</code> đầu tiên rất hay gặp <code>connect ECONNREFUSED</code> vì ứng dụng nối tới trước khi database mở cổng. Cách xử lý đúng là thêm <code>healthcheck</code> cho service <code>db</code>, hoặc để ứng dụng tự thử lại khi kết nối hỏng.</p>`,
      check: { type: 'ex', exId: 'node-71' }
    },
    {
      id: 'n11l5', title: 'Biến môi trường, volume và bí mật',
      body: `
<p>File compose sẽ được commit lên Git, nên nó <strong>không được chứa bí mật thật</strong>. Cách đúng là để giá trị nằm ngoài và tham chiếu vào:</p>
<pre><code>environment:
  - PORT=5003                      # không bí mật, viết thẳng
  - JWT_SECRET=\${JWT_SECRET}       # lấy từ máy chạy lệnh
  - HOME                           # chuyển nguyên biến cùng tên vào</code></pre>
<p>Dạng <code>\${JWT_SECRET}</code> đọc giá trị từ môi trường của máy đang chạy <code>docker compose up</code> — hoặc từ file <code>.env</code> nằm cạnh file compose. Bí mật vẫn ở ngoài Git.</p>
<p>Về volume, có hai loại và chúng phục vụ hai việc khác hẳn nhau:</p>
<table><thead><tr><th></th><th>Volume có tên</th><th>Bind mount</th></tr></thead><tbody>
<tr><td>Viết</td><td><code>postgres-data:/var/lib/postgresql/data</code></td><td><code>.:/app</code></td></tr>
<tr><td>Dữ liệu nằm ở</td><td>Vùng do Docker quản lý</td><td>Thư mục thật trên máy bạn</td></tr>
<tr><td>Dùng cho</td><td>Dữ liệu database</td><td>Code, để sửa là thấy ngay khi phát triển</td></tr>
<tr><td>Ở môi trường thật</td><td>Có</td><td><strong>Không</strong> — image phải tự chứa đủ code</td></tr>
</tbody></table>
<p>Không khai volume cho PostgreSQL thì dữ liệu nằm trong lớp ghi của container, và <code>docker compose down</code> xoá sạch.</p>
<p>Vài lệnh hay cần khi có sự cố:</p>
<pre><code>docker compose logs -f app                        # xem log ứng dụng
docker compose exec app sh                        # mở shell trong container
docker exec -it postgres-db psql -U postgres -d todoapp   # vào database chạy SQL
docker compose down -v                            # dừng và XOÁ LUÔN volume</code></pre>
<p class="warn">Cờ <code>-v</code> ở lệnh cuối xoá cả volume, tức là mất toàn bộ dữ liệu database. Rất tiện khi muốn làm lại từ đầu lúc học, và rất nguy hiểm ở mọi lúc khác.</p>`,
      check: { type: 'ex', exId: 'node-72' }
    }
  ]
}
];
