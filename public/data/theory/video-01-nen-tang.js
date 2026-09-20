/* Lý thuyết — phần nền tảng internet, Node.js và Express.
 * Mạch bài bám theo khoá "Backend Full Course" của Smoljames:
 * hiểu internet trước, rồi mới mở trình soạn thảo. */

export default [
{
  id: 'n1', title: 'Internet hoạt động thế nào',
  summary: 'Điều gì thực sự xảy ra giữa lúc bạn gõ một địa chỉ và lúc trang web hiện ra.',
  lessons: [
    {
      id: 'n1l1', title: 'Người dùng, client và frontend',
      body: `
<p>Trước khi viết dòng code backend đầu tiên, cần gọi đúng tên ba thứ mà bạn vẫn dùng mỗi ngày. Chúng nghe giống nhau nhưng là ba vai khác hẳn.</p>
<table><thead><tr><th>Tên</th><th>Là ai / là gì</th><th>Ví dụ</th></tr></thead><tbody>
<tr><td><strong>Người dùng</strong> (user)</td><td>Con người ngồi trước màn hình</td><td>Bạn</td></tr>
<tr><td><strong>Client</strong></td><td>Phần mềm qua đó người dùng chạm vào internet</td><td>Chrome, Firefox, ứng dụng điện thoại, cả một game online</td></tr>
<tr><td><strong>Frontend</strong></td><td>Giao diện mà client hiển thị ra</td><td>Trang youtube.com với các nút bấm</td></tr>
</tbody></table>
<p>Cả ba đều nằm cùng một phía: <strong>phía client</strong> (client-side). Mọi thứ chạy trên máy của người dùng đều là client-side — kể cả JavaScript mà trang web tải về rồi chạy trong trình duyệt.</p>
<p>Điều đó dẫn tới một hệ quả rất thực tế: <em>mọi thứ ở phía client đều có thể bị người dùng nhìn thấy và sửa</em>. Họ mở được DevTools, đọc được code JavaScript của bạn, sửa được giá trị trong form trước khi gửi đi. Đây là lý do mọi bài học về sau sẽ lặp lại một câu: kiểm tra ở frontend là để người dùng dễ chịu, kiểm tra ở backend mới là để an toàn.</p>
<p class="callout">Nếu frontend là mặt tiền cửa hàng thì backend là kho hàng và sổ sách. Khách xem được mặt tiền và có thể xê dịch vài thứ ở đó, nhưng chỉ nhân viên mới vào được kho.</p>`,
      check: { type: 'quiz', q: 'Form đăng ký của bạn đã kiểm tra bằng JavaScript rằng mật khẩu phải dài ít nhất 8 ký tự. Backend có cần kiểm tra lại không?',
        options: ['Không, frontend đã chặn rồi, kiểm tra lại là thừa',
          'Có, vì kiểm tra ở frontend chạy trên máy người dùng nên có thể bị bỏ qua hoàn toàn',
          'Có, nhưng chỉ cần khi ứng dụng có nhiều người dùng',
          'Không, miễn là frontend và backend do cùng một người viết'],
        answer: 1,
        explain: 'Người dùng có thể gửi request thẳng tới API bằng curl hay Postman, không đi qua form của bạn. Mọi kiểm tra ở frontend chỉ là tiện lợi; kiểm tra ở backend mới là ràng buộc thật.' }
    },
    {
      id: 'n1l2', title: 'Mạng, địa chỉ IP và DNS',
      body: `
<p>Máy của bạn không lưu sẵn mọi trang web trên đời. Vậy khi bạn mở một trang, nó lấy nội dung từ đâu?</p>
<p>Câu trả lời là từ một <strong>máy khác</strong>, thông qua <strong>mạng</strong>. Wi-Fi ở nhà, 4G trên điện thoại, cáp mạng ở trường — tất cả cuối cùng đều nối vào cùng một hệ thống cáp quang toàn cầu.</p>
<p>Mỗi thiết bị nối vào internet đều có một <strong>địa chỉ IP</strong>: bốn nhóm số như <code>142.250.204.14</code>. Đó là địa chỉ thật, giống số nhà. Nhưng không ai nhớ nổi số nhà của cả trăm trang web, nên chúng ta dùng <strong>URL</strong> — phiên bản dễ đọc của cùng địa chỉ đó.</p>
<p>Thứ dịch từ URL sang IP gọi là <strong>DNS</strong> (Domain Naming Service), cuốn danh bạ của internet:</p>
<pre>youtube.com   →   DNS   →   142.250.204.14</pre>
<p>Hai điều đáng nhớ:</p>
<ul>
<li>Mọi thiết bị nối mạng đều có IP, nhưng <strong>không phải IP nào cũng có tên miền</strong>. Server đầu tiên bạn viết trong khoá này sẽ chạy ở <code>127.0.0.1</code> — địa chỉ luôn trỏ về chính máy bạn, và có tên miền quen thuộc là <code>localhost</code>.</li>
<li>IP của một thiết bị <strong>có thể đổi</strong> khi bạn đổi mạng hoặc đổi chỗ. Tên miền thì không — đó chính là lý do nó tồn tại.</li>
</ul>`,
      check: { type: 'quiz', q: 'Bạn chạy server ở http://localhost:5003 và nó hoạt động. Bạn gửi địa chỉ này cho bạn bè nhưng họ không mở được. Vì sao?',
        options: ['Vì cổng 5003 bị nhà mạng chặn',
          'Vì localhost luôn trỏ về chính máy của người đang mở, nên máy họ không có server nào ở đó',
          'Vì thiếu HTTPS',
          'Vì DNS chưa kịp cập nhật'],
        answer: 1,
        explain: 'localhost là tên miền đặc biệt luôn ánh xạ về 127.0.0.1 — chính thiết bị đang chạy. Bạn bè mở địa chỉ đó là đang hỏi máy của chính họ, nơi chẳng có server nào đang chạy cả.' }
    },
    {
      id: 'n1l3', title: 'Giải phẫu một URL',
      body: `
<p>URL không phải một khối liền. Nó là địa chỉ nhiều tầng, và mỗi tầng trả lời một câu hỏi khác nhau.</p>
<pre>https://store.example.com:8080/api/orders?page=2#top
└─┬─┘   └─┬─┘ └────┬────┘ └┬─┘└────┬────┘└──┬──┘└┬┘
  │       │        │       │       │        │    └ fragment — cuộn tới đâu trong trang
  │       │        │       │       │        └ query    — tham số kèm theo
  │       │        │       │       └ path              — phòng nào trong toà nhà
  │       │        │       └ port                      — cửa nào trên máy đó
  │       │        └ domain                            — toà nhà nào
  │       └ subdomain                                  — khu vực nào của toà nhà
  └ protocol                                           — nói chuyện bằng ngôn ngữ nào</pre>
<table><thead><tr><th>Phần</th><th>Trả lời câu hỏi</th><th>Ghi chú</th></tr></thead><tbody>
<tr><td>protocol</td><td>Giao tiếp theo quy tắc nào</td><td><code>https</code> là <code>http</code> có mã hoá</td></tr>
<tr><td>subdomain</td><td>Nhánh nào của tên miền</td><td><code>www</code>, <code>api</code>, <code>store</code> — do bạn tự đặt</td></tr>
<tr><td>domain</td><td>Tên miền gốc</td><td>Thứ bạn phải đi mua</td></tr>
<tr><td>port</td><td>Cửa nào trên máy đó</td><td>Ẩn đi khi là 80 (http) hoặc 443 (https)</td></tr>
<tr><td>path</td><td>Tài nguyên nào</td><td>Phần backend của bạn định tuyến</td></tr>
<tr><td>query</td><td>Lọc, sắp xếp, phân trang</td><td>Luôn là chuỗi, kể cả <code>page=2</code></td></tr>
<tr><td>fragment</td><td>Vị trí trong trang</td><td><strong>Không</strong> được gửi lên server</td></tr>
</tbody></table>
<p>Chi tiết cuối bảng đáng nhớ: <strong>fragment không bao giờ rời khỏi trình duyệt</strong>. Nó chỉ dùng để cuộn tới một phần của trang, nên đừng bao giờ đặt dữ liệu quan trọng vào đó và mong server đọc được.</p>`,
      check: { type: 'ex', exId: 'node-26' }
    },
    {
      id: 'n1l4', title: 'Network request mang theo những gì',
      body: `
<p>Khi bạn nhấn Enter, trình duyệt phát ra một <strong>network request</strong>. Nó không chỉ chứa mỗi địa chỉ — nó là một gói thông tin mô tả đầy đủ ý định của bạn.</p>
<table><thead><tr><th>Thành phần</th><th>Nói lên điều gì</th><th>Ví dụ</th></tr></thead><tbody>
<tr><td><strong>Địa chỉ</strong></td><td>Gửi tới máy nào</td><td><code>142.250.204.14</code></td></tr>
<tr><td><strong>Method</strong></td><td>Muốn làm gì</td><td><code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>DELETE</code></td></tr>
<tr><td><strong>Path</strong></td><td>Muốn làm với tài nguyên nào</td><td><code>/api/orders/42</code></td></tr>
<tr><td><strong>Header</strong></td><td>Thông tin bên lề</td><td><code>Authorization</code>, <code>Content-Type</code></td></tr>
<tr><td><strong>Body</strong></td><td>Dữ liệu gửi kèm</td><td><code>{ "task": "học backend" }</code></td></tr>
</tbody></table>
<p>Method là <em>động từ</em>, path là <em>danh từ</em>. Ghép lại thành một câu hoàn chỉnh: <code>DELETE /todos/7</code> đọc là "xoá todo số 7". Cặp method + path này có một cái tên riêng: <strong>endpoint</strong>. Toàn bộ công việc định tuyến trong Express chỉ là ghép từng endpoint với một hàm xử lý.</p>
<p>Trong request còn có một thứ dễ quên: <strong>địa chỉ gửi trả</strong>. Không có nó thì server biết phải trả lời về đâu? Đây cũng là lý do một request luôn có đúng một response — như thư có địa chỉ hồi âm.</p>
<p class="callout">Header là nơi để "thông tin về thông tin": ai đang gửi (<code>Authorization</code>), dữ liệu thuộc loại gì (<code>Content-Type</code>), có được cache không (<code>Cache-Control</code>). Body là chính dữ liệu đó.</p>`,
      check: { type: 'ex', exId: 'node-27' }
    },
    {
      id: 'n1l5', title: 'Server trả lời, và vòng tròn khép lại',
      body: `
<p>Request đi tới đích và gặp một <strong>server</strong>: một máy đang chạy chương trình, được cấu hình để lắng nghe request gửi tới địa chỉ IP của nó.</p>
<pre>người dùng → client → network request → server → phản hồi → client → người dùng
                                            │
                                            └→ database, dịch vụ khác, server khác…</pre>
<p>Server đọc request, hiểu ý định, làm việc cần làm — đọc file, truy vấn database, gọi sang một dịch vụ khác — rồi đóng gói kết quả thành <strong>response</strong> gửi ngược lại. Tất cả gọn trong khoảng thời gian bạn chớp mắt.</p>
<p>Toàn bộ nửa bên kia của mũi tên chính là <strong>backend</strong>. Cụ thể nó lo bốn nhóm việc:</p>
<ul>
<li><strong>Định tuyến và trả lời</strong> — nhận request, chọn đúng đoạn code, trả response</li>
<li><strong>Quy tắc nghiệp vụ</strong> — đơn trên 2 triệu giảm 5%, một tài khoản không đặt quá 10 đơn một ngày</li>
<li><strong>Dữ liệu</strong> — lưu và lấy ra, đúng và bền</li>
<li><strong>Xác thực và phân quyền</strong> — bạn là ai, và bạn được làm gì</li>
</ul>
<p>Còn "server" thì không nhất thiết phải là một dàn máy trong trung tâm dữ liệu. Một chiếc Raspberry Pi ở góc phòng, một máy ảo trên đám mây, hay một hàm serverless — tất cả đều chỉ là <em>phần cứng chạy phần mềm, lắng nghe request</em>. Chính chiếc máy tính bạn đang ngồi cũng sắp trở thành một server ở chương tiếp theo.</p>`,
      check: { type: 'quiz', q: 'Đâu là mô tả đúng nhất về quan hệ giữa frontend và backend?',
        options: ['Frontend gọi trực tiếp vào database, backend chỉ lo giao diện',
          'Frontend là giao diện giúp người dùng phát ra network request dễ dàng hơn; backend nhận những request đó và trả về dữ liệu hoặc dịch vụ',
          'Backend chạy trong trình duyệt của người dùng',
          'Frontend và backend luôn phải nằm trên cùng một máy'],
        answer: 1,
        explain: 'Nút bấm trên giao diện chỉ là cách gói một network request cho dễ dùng. Frontend không nói chuyện thẳng với database — nếu làm vậy thì mật khẩu database sẽ nằm trong code mà ai cũng đọc được.' }
    }
  ]
},
{
  id: 'n2', title: 'Node.js: chạy JavaScript ngoài trình duyệt',
  summary: 'Runtime, package.json, hai hệ module, biến môi trường và chuyện phiên bản.',
  lessons: [
    {
      id: 'n2l1', title: 'Node khác trình duyệt chỗ nào',
      body: `
<p>JavaScript sinh ra để chạy trong trình duyệt. <strong>Node.js</strong> lấy đúng bộ máy chạy JavaScript của Chrome đem ra ngoài, rồi thay bộ công cụ xung quanh nó.</p>
<table><thead><tr><th>Trong trình duyệt có</th><th>Trong Node có</th></tr></thead><tbody>
<tr><td><code>window</code>, <code>document</code>, DOM</td><td><code>process</code>, <code>__dirname</code></td></tr>
<tr><td><code>localStorage</code></td><td>Hệ thống file (<code>node:fs</code>)</td></tr>
<tr><td><code>fetch</code> để gọi server khác</td><td><code>node:http</code> để <em>làm</em> server</td></tr>
<tr><td>Bị trình duyệt nhốt trong hộp cát</td><td>Toàn quyền trên máy, trong giới hạn của tài khoản chạy nó</td></tr>
</tbody></table>
<p>Cú pháp thì giống hệt: <code>const</code>, <code>async/await</code>, <code>map</code>, <code>filter</code> — những gì bạn biết đều dùng lại được. Chỉ có môi trường xung quanh là khác.</p>
<p>Khác biệt lớn nhất nằm ở quyền hạn. Code trong trình duyệt không mở được file trên máy người dùng — nếu mở được thì internet đã là một nơi rất đáng sợ. Code Node thì mở được, và đó vừa là sức mạnh vừa là trách nhiệm: một câu <code>npm install</code> nhầm gói có thể chạy code lạ với đúng quyền của bạn.</p>
<p class="callout">Kiểm tra bằng <code>node --version</code>. Khoá này cần Node 20 trở lên; một vài tính năng như <code>--env-file</code> và <code>node:sqlite</code> chỉ có ở các bản mới.</p>`,
      check: { type: 'quiz', q: 'Vì sao code chạy trong Node đọc ghi được file trên ổ đĩa còn code trong trình duyệt thì không?',
        options: ['Vì Node dùng ngôn ngữ khác',
          'Vì trình duyệt cố tình nhốt code trong hộp cát để trang web lạ không đụng được vào máy người dùng',
          'Vì Node chạy nhanh hơn',
          'Vì trình duyệt chưa hỗ trợ tính năng đó'],
        answer: 1,
        explain: 'Đây là quyết định bảo mật, không phải giới hạn kỹ thuật. Bạn mở hàng chục trang lạ mỗi ngày; nếu trang nào cũng đọc được ổ đĩa thì không ai dám lên mạng. Code Node là code bạn chủ động chạy nên được tin tưởng hơn.' }
    },
    {
      id: 'n2l2', title: 'package.json và npm script',
      body: `
<p><code>npm init -y</code> sinh ra <code>package.json</code> — tấm căn cước của dự án. Mọi thứ npm cần biết đều nằm ở đây.</p>
<pre><code>{
  "name": "todo-app",
  "type": "module",
  "scripts": {
    "dev": "node --watch --env-file=.env ./src/server.js"
  },
  "dependencies": {
    "express": "^4.21.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}</code></pre>
<table><thead><tr><th>Trường</th><th>Ý nghĩa</th></tr></thead><tbody>
<tr><td><code>type</code></td><td><code>"module"</code> để dùng <code>import</code>; bỏ trống thì Node hiểu là CommonJS</td></tr>
<tr><td><code>scripts</code></td><td>Lệnh đặt tên sẵn, chạy bằng <code>npm run &lt;tên&gt;</code></td></tr>
<tr><td><code>dependencies</code></td><td>Thư viện ứng dụng cần khi chạy thật</td></tr>
<tr><td><code>devDependencies</code></td><td>Thư viện chỉ cần lúc phát triển, ví dụ công cụ test</td></tr>
</tbody></table>
<p>Hai cờ trong script <code>dev</code> đáng để ý:</p>
<ul>
<li><code>--watch</code> — Node tự khởi động lại khi file đổi. Trước đây phải cài <code>nodemon</code>, giờ Node làm sẵn.</li>
<li><code>--env-file=.env</code> — nạp biến môi trường từ file, không cần thư viện <code>dotenv</code>.</li>
</ul>
<p>Còn một hành vi ít người biết: npm tự chạy <code>pre&lt;tên&gt;</code> trước và <code>post&lt;tên&gt;</code> sau. Dự án Prisma thường đặt <code>"predev": "npx prisma generate"</code> để client luôn được sinh lại trước khi server khởi động. Bài tập dưới đây dựng lại đúng cơ chế đó.</p>`,
      check: { type: 'ex', exId: 'node-33' }
    },
    {
      id: 'n2l3', title: 'CommonJS và ES Module',
      body: `
<p>Node có hai cách chia code thành module, và lẫn lộn giữa chúng là lỗi khiến người mới mất buổi chiều.</p>
<table><thead><tr><th></th><th>CommonJS (cũ)</th><th>ES Module (mới)</th></tr></thead><tbody>
<tr><td>Nhập</td><td><code>const express = require('express')</code></td><td><code>import express from 'express'</code></td></tr>
<tr><td>Xuất</td><td><code>module.exports = router</code></td><td><code>export default router</code></td></tr>
<tr><td>Bật bằng</td><td>Mặc định</td><td><code>"type": "module"</code> trong package.json</td></tr>
<tr><td>Đuôi file</td><td><code>.js</code> hoặc <code>.cjs</code></td><td><code>.js</code> hoặc <code>.mjs</code></td></tr>
</tbody></table>
<p>Khoá này dùng ES Module, vì nó là cú pháp bạn đã quen từ frontend và là hướng đi lâu dài của JavaScript. Nhưng rất nhiều bài hướng dẫn trên mạng vẫn viết <code>require</code>, và chép nhầm sẽ cho ra một trong hai thông báo lỗi sau:</p>
<ul>
<li><code>ReferenceError: require is not defined</code> — file đang là ESM mà bạn viết <code>require</code></li>
<li><code>Cannot use import statement outside a module</code> — ngược lại, thiếu <code>"type": "module"</code></li>
</ul>
<p>Một khác biệt nữa hay vấp: ESM <strong>không có sẵn</strong> <code>__dirname</code>. Muốn biết thư mục của file hiện tại phải tự dựng lại:</p>
<pre><code>import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)</code></pre>
<p>Đoạn này sẽ xuất hiện nguyên xi trong <code>server.js</code> ở chương sau, khi cần trỏ Express tới thư mục <code>public</code>.</p>`,
      check: { type: 'ex', exId: 'node-32' }
    },
    {
      id: 'n2l4', title: 'Biến môi trường và file .env',
      body: `
<p>Khoá bí mật JWT, chuỗi kết nối database, cổng chạy server — ba thứ này có điểm chung: chúng <strong>đổi theo môi trường</strong> và <strong>không được nằm trong Git</strong>.</p>
<p>Cách giải quyết là biến môi trường. Trong Node, chúng nằm ở <code>process.env</code>, và luôn là <strong>chuỗi</strong>:</p>
<pre><code>const PORT = process.env.PORT || 5003
const secret = process.env.JWT_SECRET</code></pre>
<p>Khi phát triển, bạn viết chúng vào file <code>.env</code>:</p>
<pre><code># cau hinh may cuc bo
PORT=5003
JWT_SECRET=doi-chuoi-nay-truoc-khi-deploy
DATABASE_URL=postgresql://postgres:postgres@db:5432/todoapp</code></pre>
<p>rồi chạy <code>node --env-file=.env ./src/server.js</code>.</p>
<p>Ba quy tắc đi kèm, bỏ quy tắc nào cũng có ngày trả giá:</p>
<ol>
<li><code>.env</code> phải nằm trong <code>.gitignore</code>. Khoá bí mật đã lỡ đẩy lên GitHub thì coi như đã lộ, kể cả khi bạn xoá commit sau đó.</li>
<li>Kèm theo một file <code>.env.example</code> có đủ <em>tên</em> biến nhưng giá trị để trống. Người mới clone dự án biết ngay phải điền gì.</li>
<li>Mọi giá trị đều là chuỗi. <code>process.env.PORT</code> trả về <code>'5003'</code> chứ không phải <code>5003</code>, và <code>process.env.DEBUG</code> bằng <code>'false'</code> thì vẫn là một chuỗi khác rỗng, tức là <em>truthy</em>.</li>
</ol>`,
      check: { type: 'ex', exId: 'node-31' }
    },
    {
      id: 'n2l5', title: 'Phiên bản, dấu ^ và lockfile',
      body: `
<p><code>"express": "^4.21.1"</code> không có nghĩa là "dùng đúng bản 4.21.1". Nó là một <em>khoảng</em>, và hiểu sai khoảng này dẫn tới câu nói kinh điển: "máy tôi chạy được mà".</p>
<p>Phiên bản có ba số, gọi là <strong>semantic versioning</strong>:</p>
<pre>4 . 21 . 1
│    │    └ patch — sửa lỗi, không đổi cách dùng
│    └ minor      — thêm tính năng, code cũ vẫn chạy
└ major           — có thay đổi phá vỡ, code cũ có thể hỏng</pre>
<table><thead><tr><th>Ghi trong package.json</th><th>npm được phép cài</th></tr></thead><tbody>
<tr><td><code>^4.21.1</code></td><td>Mọi bản 4.x.x từ 4.21.1 trở lên. Không lên 5.</td></tr>
<tr><td><code>~4.21.1</code></td><td>Chỉ 4.21.x từ 4.21.1 trở lên. Không lên 4.22.</td></tr>
<tr><td><code>4.21.1</code></td><td>Đúng bản đó, không hơn không kém.</td></tr>
</tbody></table>
<p>Vậy nếu hôm nay bạn cài được 4.21.1 còn tuần sau đồng đội cài được 4.30.0, hai máy chạy hai bản khác nhau. Đó là việc của <code>package-lock.json</code>: nó ghi lại <strong>đúng</strong> phiên bản đã cài, của cả thư viện phụ thuộc của thư viện. Vì vậy:</p>
<ul>
<li><code>package-lock.json</code> <strong>phải</strong> được commit lên Git</li>
<li><code>node_modules</code> <strong>không bao giờ</strong> commit — nó nặng, sinh lại được, và khác nhau giữa các hệ điều hành</li>
<li>Khi cài lại trên máy sạch hoặc trong CI, dùng <code>npm ci</code> thay cho <code>npm install</code>: nó cài đúng theo lockfile và không tự ý nâng cấp gì cả</li>
</ul>`,
      check: { type: 'ex', exId: 'node-34' }
    }
  ]
},
{
  id: 'n3', title: 'Express: server đầu tiên',
  summary: 'app và cổng, req và res, endpoint trang web và endpoint API, body và status code.',
  lessons: [
    {
      id: 'n3l1', title: 'app, listen và cổng',
      body: `
<p>Node tự nó đã làm được server bằng module <code>node:http</code>, nhưng bạn sẽ phải tự tay đọc URL, tự tách method, tự nối chuỗi HTML. <strong>Express</strong> lo hết phần lặp đi lặp lại đó.</p>
<pre><code>import express from 'express'

const app = express()
const PORT = process.env.PORT || 5003

app.get('/', (req, res) => {
  res.send('&lt;h1&gt;Xin chào&lt;/h1&gt;')
})

app.listen(PORT, () => {
  console.log(\`Server đã chạy ở cổng: \${PORT}\`)
})</code></pre>
<p>Năm dòng, và máy bạn đã là một server thật. Từng phần:</p>
<table><thead><tr><th>Dòng</th><th>Việc nó làm</th></tr></thead><tbody>
<tr><td><code>express()</code></td><td>Tạo ứng dụng — nơi bạn đăng ký mọi endpoint</td></tr>
<tr><td><code>app.get(path, handler)</code></td><td>Gắn một endpoint: method GET, đường dẫn này, chạy hàm này</td></tr>
<tr><td><code>app.listen(PORT)</code></td><td>Bắt đầu lắng nghe. Không có dòng này, chương trình chạy xong rồi thoát</td></tr>
</tbody></table>
<p><strong>Cổng</strong> là con số phân biệt các chương trình cùng chạy trên một máy. Một địa chỉ IP có 65535 cổng; server của bạn xin giữ một cổng và mọi request tới cổng đó sẽ được chuyển cho nó. Khi bạn mở <code>http://localhost:5003</code>, bạn đang nói: máy này, cổng 5003.</p>
<p class="warn">Gặp <code>EADDRINUSE</code> nghĩa là cổng đã có chương trình khác giữ — thường là chính server cũ của bạn chưa tắt hẳn. Đổi cổng hoặc tắt tiến trình cũ.</p>`,
      check: { type: 'ex', exId: 'node-41' }
    },
    {
      id: 'n3l2', title: 'req và res',
      body: `
<p>Mọi hàm xử lý trong Express đều nhận hai tham số. Hiểu chúng là hiểu quá nửa Express.</p>
<table><thead><tr><th><code>req</code> — thứ đi vào</th><th><code>res</code> — thứ đi ra</th></tr></thead><tbody>
<tr><td><code>req.method</code>, <code>req.url</code></td><td><code>res.status(code)</code></td></tr>
<tr><td><code>req.params</code> — tham số trong đường dẫn</td><td><code>res.json(data)</code></td></tr>
<tr><td><code>req.query</code> — tham số sau dấu <code>?</code></td><td><code>res.send(html)</code></td></tr>
<tr><td><code>req.body</code> — dữ liệu gửi lên</td><td><code>res.sendStatus(code)</code></td></tr>
<tr><td><code>req.headers</code></td><td><code>res.sendFile(path)</code></td></tr>
</tbody></table>
<p>Ba nơi lấy dữ liệu từ <code>req</code>, mỗi nơi một mục đích:</p>
<pre><code>// PUT /todos/2?page=4   với body { "completed": 1 }
router.put('/:id', (req, res) => {
  const { id } = req.params      // '2'  — định danh tài nguyên
  const { page } = req.query     // '4'  — tuỳ chọn thêm
  const { completed } = req.body // 1    — dữ liệu cần lưu
})</code></pre>
<p><code>req.params</code> và <code>req.query</code> <strong>luôn là chuỗi</strong>, vì URL vốn là văn bản. Cần số thì phải tự ép: <code>parseInt(id)</code>.</p>
<p>Còn <code>res</code> có một quy tắc sắt: <strong>mỗi request chỉ được trả lời một lần</strong>. Gọi <code>res.json</code> hai lần sẽ cho lỗi <em>Cannot set headers after they are sent</em>. Nguyên nhân gần như luôn là quên <code>return</code>:</p>
<pre><code>// SAI — thiếu return, hàm chạy tiếp và trả lời lần nữa
if (!user) { res.status(404).json({ message: 'Không thấy' }) }
res.json(user)

// ĐÚNG
if (!user) { return res.status(404).json({ message: 'Không thấy' }) }
res.json(user)</code></pre>
<p>Còn <code>res.status(...)</code> thì trả về chính <code>res</code>, nhờ vậy mới viết nối được thành <code>res.status(201).json(data)</code>. Bài tập dưới đây yêu cầu bạn tự dựng lại <code>res</code>, và cả hai tính chất trên sẽ hiện ra rất rõ.</p>`,
      check: { type: 'ex', exId: 'node-37' }
    },
    {
      id: 'n3l3', title: 'Endpoint trang web và endpoint API',
      body: `
<p>Cùng viết bằng <code>app.get</code>, nhưng một server Express phục vụ hai loại endpoint khác hẳn nhau về mục đích.</p>
<table><thead><tr><th></th><th>Endpoint trang web</th><th>Endpoint API</th></tr></thead><tbody>
<tr><td>Ai gọi</td><td>Người dùng gõ URL</td><td>Code gọi: fetch, Postman, ứng dụng khác</td></tr>
<tr><td>Trả về</td><td>HTML</td><td>JSON</td></tr>
<tr><td>Gọi bằng</td><td><code>res.send(html)</code> hoặc <code>res.sendFile(...)</code></td><td><code>res.json(data)</code></td></tr>
<tr><td>Đường dẫn quen thuộc</td><td><code>/</code>, <code>/dashboard</code></td><td><code>/api/data</code>, <code>/todos</code></td></tr>
</tbody></table>
<pre><code>// endpoint trang web
app.get('/', (req, res) => {
  res.send('&lt;body&gt;&lt;h1&gt;Trang chủ&lt;/h1&gt;&lt;a href="/dashboard"&gt;Bảng điều khiển&lt;/a&gt;&lt;/body&gt;')
})

// endpoint API
app.get('/api/data', (req, res) => {
  res.json(data)
})</code></pre>
<p>Trong dự án thật, trả HTML bằng cách nối chuỗi rất nhanh chóng trở thành cơn ác mộng. Nên bạn để HTML trong file và bảo Express phục vụ cả thư mục:</p>
<pre><code>app.use(express.static(path.join(__dirname, '../public')))</code></pre>
<p>Một dòng đó nói: mọi file trong <code>public</code> đều gửi được cho ai xin. Request tới <code>/styles.css</code> sẽ được trả file <code>public/styles.css</code>, không cần viết endpoint nào cả.</p>
<p class="callout">Tiền tố <code>/api</code> không bắt buộc, nhưng nên có. Nó tách rõ hai thế giới, và sau này khi bạn đặt một reverse proxy phía trước, việc "mọi thứ bắt đầu bằng /api thì chuyển về server Node" trở thành một dòng cấu hình.</p>`,
      check: { type: 'ex', exId: 'node-38' }
    },
    {
      id: 'n3l4', title: 'express.json() và req.body',
      body: `
<p>Đây là dòng mà ai cũng chép và ít ai hiểu:</p>
<pre><code>app.use(express.json())</code></pre>
<p>Bỏ nó đi, gửi một <code>POST</code> có JSON lên, rồi <code>console.log(req.body)</code> — bạn nhận được <code>undefined</code>. Đây là lỗi phổ biến bậc nhất của người mới học Express, và nó không hề báo lỗi gì cả, chỉ lặng lẽ cho ra <code>undefined</code>.</p>
<p>Lý do: body của request đi tới server dưới dạng văn bản thô. Express không tự đoán bạn muốn nó hiểu văn bản đó thành gì — có thể là JSON, có thể là dữ liệu form, có thể là file ảnh. <code>express.json()</code> là mảnh code bảo nó: <em>nếu header </em><code>Content-Type</code><em> nói đây là JSON thì hãy parse và gán vào </em><code>req.body</code>.</p>
<p>Chú ý điều kiện "nếu". Gửi JSON mà quên đặt <code>Content-Type: application/json</code> thì <code>express.json()</code> bỏ qua, và <code>req.body</code> vẫn rỗng. Khi dùng file <code>.rest</code> hay Postman, dòng header đó là bắt buộc:</p>
<pre><code>POST http://localhost:5003/auth/register
Content-Type: application/json

{
    "username": "gilgamesh@gmail.com",
    "password": "123123123"
}</code></pre>
<p>Một điều nữa: <code>express.json()</code> là <strong>middleware</strong> — đoạn code chạy xen giữa lúc request tới và lúc handler của bạn chạy. Nó phải được đăng ký <em>trước</em> các route cần dùng <code>req.body</code>, vì Express chạy mọi thứ theo đúng thứ tự khai báo. Chương sau sẽ nói kỹ về middleware; ở đây chỉ cần nhớ thứ tự.</p>`,
      check: { type: 'ex', exId: 'node-39' }
    },
    {
      id: 'n3l5', title: 'Trả đúng status code',
      body: `
<p>Response nào cũng mang theo một con số. Trả <code>200</code> cho mọi thứ thì vẫn chạy, nhưng bạn đang vứt bỏ cách giao tiếp chuẩn mực nhất mà HTTP có.</p>
<table><thead><tr><th>Nhóm</th><th>Nghĩa</th><th>Hay gặp</th></tr></thead><tbody>
<tr><td><strong>2xx</strong></td><td>Thành công</td><td>200 OK · 201 Created · 204 No Content</td></tr>
<tr><td><strong>3xx</strong></td><td>Đi chỗ khác</td><td>301 chuyển vĩnh viễn · 304 dùng lại bản cache</td></tr>
<tr><td><strong>4xx</strong></td><td>Client sai</td><td>400 · 401 · 403 · 404 · 409 · 422 · 429</td></tr>
<tr><td><strong>5xx</strong></td><td>Server sai</td><td>500 · 502 · 503</td></tr>
</tbody></table>
<p>Ranh giới 4xx / 5xx là ranh giới <em>trách nhiệm</em>: 4xx nghĩa là "bạn gửi sai, sửa rồi gửi lại"; 5xx nghĩa là "tôi hỏng, gửi lại y hệt cũng vô ích". Trả 500 cho một request thiếu trường bắt buộc là đổ lỗi sai người, và sẽ làm hệ thống giám sát của bạn báo động nhầm.</p>
<p>Bốn cặp dễ nhầm:</p>
<ul>
<li><strong>401 hay 403</strong> — 401 là "tôi không biết bạn là ai" (chưa đăng nhập, token hỏng). 403 là "tôi biết bạn là ai, nhưng bạn không được phép".</li>
<li><strong>200 hay 201</strong> — tạo mới xong thì trả 201, kèm header <code>Location</code> chỉ tới tài nguyên vừa tạo.</li>
<li><strong>204 hay 200</strong> — xoá xong, không có gì để trả thì 204, và body phải rỗng thật.</li>
<li><strong>400 hay 422</strong> — 400 là request hỏng ở tầng cú pháp (JSON không parse được). 422 là JSON đúng nhưng nội dung không hợp lệ (thiếu trường, số âm).</li>
</ul>
<p>Trong Express, status code đặt bằng <code>res.status(201).json(...)</code>, hoặc <code>res.sendStatus(204)</code> khi không có body. Bài tập dưới đây tách phần quyết định status ra khỏi phần xử lý nghiệp vụ — một cách tổ chức mà bạn sẽ thấy lại trong mọi dự án lớn.</p>`,
      check: { type: 'ex', exId: 'node-40' }
    }
  ]
}
];
