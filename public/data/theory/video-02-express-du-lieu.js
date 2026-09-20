/* Lý thuyết — middleware, router và lớp dữ liệu SQLite.
 * Tương ứng chương 2 và chương 3 của khoá "Backend Full Course". */

export default [
{
  id: 'n4', title: 'Middleware',
  summary: 'Chuỗi hàm chạy trước handler: thứ tự, file tĩnh, xử lý lỗi và CORS.',
  lessons: [
    {
      id: 'n4l1', title: 'Middleware là gì và next() làm gì',
      body: `
<p>Một request đi vào Express không nhảy thẳng tới handler của bạn. Nó đi qua một <strong>chuỗi</strong> hàm, và mỗi hàm được quyền xem, sửa, hoặc chặn hẳn nó lại.</p>
<pre>request → [express.json] → [log] → [xác thực] → handler → response
              │                │          │
         đọc body       ghi một dòng   chặn nếu
         vào req.body      log         thiếu token</pre>
<p>Mỗi mắt xích là một <strong>middleware</strong>: một hàm nhận ba tham số.</p>
<pre><code>function logger(req, res, next) {
  console.log(req.method, req.url)
  next()            // chuyển cho mắt xích sau
}

app.use(logger)</code></pre>
<p>Tham số <code>next</code> là công tắc. Gọi nó thì chuỗi chạy tiếp; không gọi thì chuỗi dừng lại ngay tại đó. Middleware xác thực dùng đúng tính chất này:</p>
<pre><code>function authMiddleware(req, res, next) {
  const token = req.headers['authorization']
  if (!token) { return res.status(401).json({ message: "No token provided" }) }
  // ... kiểm tra token ...
  req.userId = decoded.id   // gắn thêm dữ liệu cho mắt xích sau dùng
  next()
}</code></pre>
<p>Hai thói quen đáng nhớ từ đoạn code trên:</p>
<ul>
<li><strong>Quên <code>next()</code></strong> thì request treo vĩnh viễn — client chờ tới khi hết thời gian mà không có thông báo lỗi nào. Đây là một trong những lỗi khó tìm nhất với người mới.</li>
<li><strong>Middleware gắn dữ liệu vào <code>req</code></strong> để dùng lại về sau. <code>req.userId</code> do middleware đặt, và mọi route phía sau đọc được mà không cần biết token là gì.</li>
</ul>`,
      check: { type: 'ex', exId: 'node-44' }
    },
    {
      id: 'n4l2', title: 'Thứ tự khai báo quyết định tất cả',
      body: `
<p>Express chạy middleware theo <strong>đúng thứ tự bạn viết trong file</strong>. Không có độ ưu tiên, không có sắp xếp thông minh. Dòng trên chạy trước dòng dưới.</p>
<p>Điều đó biến một dòng đặt sai chỗ thành một lỗi im lặng. Ví dụ từ dự án của khoá học:</p>
<pre><code>// ĐÚNG
app.use(express.json())          // 1. đọc body trước
app.use('/todos', todoRoutes)    // 2. route mới thấy req.body

// SAI — req.body sẽ là undefined trong mọi route của todoRoutes
app.use('/todos', todoRoutes)
app.use(express.json())</code></pre>
<p>Bảng thứ tự thường dùng, từ trên xuống:</p>
<table><thead><tr><th>#</th><th>Middleware</th><th>Vì sao đặt ở đó</th></tr></thead><tbody>
<tr><td>1</td><td>Log request</td><td>Muốn thấy cả những request bị chặn ngay sau đó</td></tr>
<tr><td>2</td><td>CORS</td><td>Phải trả header kể cả khi request sau đó bị từ chối</td></tr>
<tr><td>3</td><td><code>express.json()</code></td><td>Mọi thứ phía sau đều cần <code>req.body</code></td></tr>
<tr><td>4</td><td><code>express.static()</code></td><td>File tĩnh trả luôn, không phải chạy qua xác thực</td></tr>
<tr><td>5</td><td>Xác thực</td><td>Chỉ gắn cho những nhóm route cần</td></tr>
<tr><td>6</td><td>Các route</td><td>Việc chính</td></tr>
<tr><td>7</td><td>404</td><td>Không route nào nhận thì rơi xuống đây</td></tr>
<tr><td>8</td><td>Xử lý lỗi</td><td>Bốn tham số, luôn đặt cuối cùng</td></tr>
</tbody></table>
<p>Middleware cũng gắn được cho một nhóm route thay vì toàn bộ ứng dụng. Trong <code>server.js</code>:</p>
<pre><code>app.use('/auth', authRoutes)                   // ai cũng gọi được
app.use('/todos', authMiddleware, todoRoutes)  // phải có token</code></pre>
<p>Một dòng đó là toàn bộ cơ chế bảo vệ: <code>authMiddleware</code> đứng chắn trước <code>todoRoutes</code>, nên không một endpoint todo nào chạy được nếu chưa qua cửa.</p>`,
      check: { type: 'quiz', q: 'Bạn gắn middleware ghi log SAU dòng app.use("/todos", authMiddleware, todoRoutes). Hậu quả là gì?',
        options: ['Log sẽ ghi hai lần cho mỗi request',
          'Những request bị authMiddleware chặn bằng 401 sẽ không được ghi log, vì chuỗi đã dừng trước khi tới middleware log',
          'Không có gì thay đổi, Express tự sắp xếp lại',
          'Server sẽ không khởi động được'],
        answer: 1,
        explain: 'authMiddleware không gọi next() khi thiếu token, nên chuỗi dừng ngay tại đó. Mọi middleware khai báo sau đều không chạy — và bạn mất đúng những dòng log cần nhất khi điều tra sự cố đăng nhập.' }
    },
    {
      id: 'n4l3', title: 'express.static và file tĩnh',
      body: `
<p>Trả HTML bằng cách nối chuỗi trong <code>res.send()</code> chỉ vui được vài phút. Dự án thật đặt HTML, CSS, ảnh vào một thư mục rồi bảo Express phục vụ cả thư mục đó:</p>
<pre><code>import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(express.static(path.join(__dirname, '../public')))</code></pre>
<p>Sau dòng này, request tới <code>/styles.css</code> được trả file <code>public/styles.css</code>, và <code>/</code> được trả <code>public/index.html</code> — không cần viết endpoint nào cả.</p>
<p>Ba chi tiết đáng để ý:</p>
<ul>
<li><strong>Đường dẫn phải tuyệt đối.</strong> Đưa vào chuỗi <code>'public'</code> thì Express tính tương đối với thư mục bạn <em>chạy lệnh</em>, không phải thư mục chứa file. Chạy <code>node src/server.js</code> từ chỗ khác là hỏng ngay. Đó là lý do phải dựng <code>__dirname</code> rồi ghép bằng <code>path.join</code>.</li>
<li><strong>Đặt trước middleware xác thực.</strong> File CSS không cần token, và bắt trình duyệt gửi token cho từng ảnh là vô nghĩa.</li>
<li><strong>Chỉ đưa vào đó thứ ai cũng được xem.</strong> Mọi file trong thư mục tĩnh đều tải về được, kể cả file bạn quên dọn.</li>
</ul>
<p>Bên dưới, Express phải ghép <code>root + đường dẫn client xin</code>. Phép ghép đó là nơi ẩn một lỗ hổng kinh điển: request tới <code>/../../etc/passwd</code>. Bài tập dưới đây yêu cầu bạn tự viết phép ghép an toàn.</p>`,
      check: { type: 'ex', exId: 'node-42' }
    },
    {
      id: 'n4l4', title: 'Middleware xử lý lỗi',
      body: `
<p>Không có xử lý lỗi tập trung thì mỗi route đều phải tự bọc <code>try/catch</code>, và sớm muộn cũng có chỗ quên — khi đó Express trả về một trang lỗi mặc định kèm nguyên cái stack trace cho người dùng xem.</p>
<p>Express nhận ra middleware xử lý lỗi bằng một dấu hiệu bất ngờ: <strong>nó có bốn tham số</strong>.</p>
<pre><code>// middleware thường — 3 tham số
app.use((req, res, next) => { ... })

// middleware xử lý lỗi — 4 tham số, err đứng đầu
app.use((err, req, res, next) => { ... })</code></pre>
<p>Viết thiếu <code>next</code>, Express đếm được ba tham số và coi đây là middleware thường. Nó sẽ không bao giờ nhận được lỗi, dù code bên trong hoàn toàn đúng. Không có cảnh báo nào cả.</p>
<p>Ba quy tắc cho middleware loại này:</p>
<ol>
<li><strong>Đặt cuối cùng</strong>, sau mọi route. Express chỉ nhảy tới nó khi có lỗi được ném ra hoặc khi ai đó gọi <code>next(err)</code>.</li>
<li><strong>Không để lộ chi tiết nội bộ</strong> trong nhánh 500. Thông báo lỗi thật thường chứa tên bảng, đường dẫn file, đôi khi cả chuỗi kết nối database.</li>
<li><strong>Trả về một <code>traceId</code></strong>. Người dùng đọc được mã đó cho bạn, và bạn tra ra đúng dòng log — không cần họ mô tả lại sự việc.</li>
</ol>
<p class="callout">Với route <code>async</code>, Express 4 <strong>không</strong> tự bắt lỗi của Promise bị reject. Hoặc bạn bọc mỗi handler bằng một hàm tiện ích, hoặc nâng lên Express 5 — bản này bắt giúp bạn.</p>`,
      check: { type: 'ex', exId: 'node-45' }
    },
    {
      id: 'n4l5', title: 'CORS — lỗi đầu tiên của người học full stack',
      body: `
<p>Frontend chạy ở <code>localhost:5173</code>, backend ở <code>localhost:5003</code>. Bạn gọi API và console báo:</p>
<pre>Access to fetch at 'http://localhost:5003/todos' from origin
'http://localhost:5173' has been blocked by CORS policy</pre>
<p>Ba điều cần hiểu trước khi sửa:</p>
<ul>
<li><strong>Origin</strong> là bộ ba protocol + domain + port. Khác một trong ba là khác origin — <code>localhost:5173</code> và <code>localhost:5003</code> là hai origin khác nhau.</li>
<li><strong>Đây là quy tắc của trình duyệt</strong>, không phải lỗi trong code của bạn. Request vẫn tới được server và server vẫn trả lời; chính trình duyệt mới là bên từ chối đưa kết quả cho JavaScript.</li>
<li><strong>Chỉ server gỡ được.</strong> Không có cách nào sửa từ phía frontend — và cũng vì thế, CORS <em>không</em> bảo vệ server của bạn. curl và Postman bỏ qua nó hoàn toàn.</li>
</ul>
<p>Cách gỡ là trả thêm vài header, thường bằng gói <code>cors</code>:</p>
<pre><code>import cors from 'cors'

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))</code></pre>
<p>Với request "phức tạp" — có header lạ như <code>Authorization</code>, hoặc method <code>PUT</code>/<code>DELETE</code> — trình duyệt còn gửi trước một request <code>OPTIONS</code> để hỏi xin phép. Đó là <strong>preflight</strong>. Nếu server không trả lời <code>OPTIONS</code> thì request thật không bao giờ được gửi đi, và trong tab Network bạn chỉ thấy một dòng <code>OPTIONS</code> đỏ.</p>
<p class="warn">Đừng dùng <code>origin: '*'</code> cho API có đăng nhập. Chuẩn CORS cấm dùng dấu sao chung với <code>credentials: true</code>, và lý do rất hợp lý: cho phép mọi trang trên internet gửi kèm cookie của người dùng tới API của bạn là mở cửa cho bất kỳ ai thao tác thay họ.</p>`,
      check: { type: 'ex', exId: 'node-56' }
    }
  ]
},
{
  id: 'n5', title: 'Router và cấu trúc dự án',
  summary: 'Tách route ra file riêng, gắn vào tiền tố, và vì sao thứ tự khai báo lại quan trọng.',
  lessons: [
    {
      id: 'n5l1', title: 'express.Router()',
      body: `
<p>Nhét toàn bộ route vào <code>server.js</code> chạy được — tới khoảng route thứ mười. Sau đó file thành một khối hai trăm dòng mà sửa gì cũng sợ.</p>
<p><strong>Router</strong> là một ứng dụng Express thu nhỏ: nó có bảng route riêng, middleware riêng, và nằm trong file riêng.</p>
<pre><code>// src/routes/todoRoutes.js
import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req, res) => { ... })
router.post('/', (req, res) => { ... })
router.put('/:id', (req, res) => { ... })
router.delete('/:id', (req, res) => { ... })

export default router</code></pre>
<p>Chú ý các đường dẫn: <code>'/'</code> và <code>'/:id'</code>, không phải <code>'/todos'</code> và <code>'/todos/:id'</code>. Router không biết nó sẽ được gắn ở đâu — đó là việc của <code>server.js</code>. Nhờ vậy muốn đổi <code>/todos</code> thành <code>/api/v2/todos</code> thì chỉ sửa một dòng, không đụng tới file route.</p>
<p>Bên trong, router làm đúng hai việc: giữ một bảng <em>(method, đường dẫn, handler)</em>, và khi có request thì duyệt bảng tìm dòng khớp đầu tiên. Bài tập dưới đây dựng lại đúng hai việc đó.</p>`,
      check: { type: 'ex', exId: 'node-46' }
    },
    {
      id: 'n5l2', title: 'Gắn router vào một tiền tố',
      body: `
<p>Router tự nó chưa phục vụ được gì. <code>server.js</code> gắn nó vào một đường dẫn gốc:</p>
<pre><code>app.use('/auth', authRoutes)
app.use('/todos', authMiddleware, todoRoutes)</code></pre>
<p>Một request tới <code>POST /todos/42</code> sẽ đi qua ba bước:</p>
<ol>
<li>Express thấy đường dẫn bắt đầu bằng <code>/todos</code> → chọn mount này</li>
<li>Chạy <code>authMiddleware</code>; nó chặn thì dừng luôn tại đây</li>
<li>Cắt bỏ tiền tố, đưa phần còn lại là <code>/42</code> cho <code>todoRoutes</code></li>
</ol>
<p>Phép cắt ở bước ba là điều khiến router dùng lại được: bên trong <code>todoRoutes</code>, bạn viết <code>router.put('/:id')</code> mà không cần biết mình đang sống ở <code>/todos</code> hay <code>/api/todos</code>.</p>
<p>Dòng <code>app.use('/todos', authMiddleware, todoRoutes)</code> còn cho thấy một điều gọn gàng: middleware gắn được cho <em>cả nhóm</em> route. Bạn không phải nhớ thêm <code>authMiddleware</code> vào từng endpoint todo, và quan trọng hơn — không có endpoint nào bị quên.</p>
<p class="callout">Một cái bẫy khi tự cài: tiền tố <code>/todos</code> không được khớp với <code>/todosaurus</code>. Chỉ dùng <code>startsWith(prefix)</code> là dính ngay. Phải là bằng đúng tiền tố, hoặc bắt đầu bằng tiền tố cộng dấu gạch chéo.</p>`,
      check: { type: 'ex', exId: 'node-47' }
    },
    {
      id: 'n5l3', title: 'Thứ tự route và route bắt tất cả',
      body: `
<p>Express duyệt bảng route từ trên xuống và <strong>dừng ở dòng khớp đầu tiên</strong>. Không có chuyện "route cụ thể hơn thì thắng" — chỉ có thứ tự bạn viết.</p>
<pre><code>// SAI
router.get('/:id', ...)        // nuốt mọi thứ
router.get('/search', ...)     // không bao giờ chạy

// ĐÚNG
router.get('/search', ...)     // cụ thể trước
router.get('/:id', ...)        // tham số sau</code></pre>
<p>Ở phiên bản sai, request tới <code>/search</code> rơi vào route đầu với <code>req.params.id === 'search'</code>. Không có lỗi nào được ném ra; bạn chỉ nhận về "không tìm thấy todo có id là search" và ngồi nghĩ mãi không hiểu.</p>
<p>Quy tắc rút ra: <strong>càng cụ thể thì càng phải đặt lên trên</strong>. Route có tham số xuống dưới, và route bắt tất cả thì đặt cuối cùng:</p>
<pre><code>app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy endpoint' })
})</code></pre>
<p>Middleware này không khai báo đường dẫn nên khớp với mọi thứ. Đặt sau tất cả các route, nó chính là trang 404 của API — và nó chỉ chạy khi không route nào nhận request, đúng như mong muốn.</p>`,
      check: { type: 'ex', exId: 'node-48' }
    },
    {
      id: 'n5l4', title: 'Cấu trúc thư mục dự án',
      body: `
<p>Đây là cấu trúc của dự án todo trong khoá học — nhỏ, nhưng đã đủ các ranh giới cần có:</p>
<pre>todo-app/
├── public/
│   ├── index.html          giao diện, Express phục vụ như file tĩnh
│   └── styles.css
├── src/
│   ├── server.js           điểm khởi động: middleware, gắn router, listen
│   ├── db.js               kết nối database và tạo bảng
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── routes/
│       ├── authRoutes.js   POST /register, POST /login
│       └── todoRoutes.js   CRUD todo, đã được bảo vệ
├── .env                    bí mật — nằm trong .gitignore
├── .env.example            tên biến, giá trị để trống — có commit
├── package.json
└── todo-app.rest           các request mẫu để thử API</pre>
<p>Nguyên tắc đằng sau: <strong>mỗi file trả lời một câu hỏi</strong>.</p>
<table><thead><tr><th>File</th><th>Trả lời</th></tr></thead><tbody>
<tr><td><code>server.js</code></td><td>Ứng dụng gồm những mảnh nào, ghép theo thứ tự nào</td></tr>
<tr><td><code>db.js</code></td><td>Dữ liệu nằm ở đâu, bảng có hình dạng gì</td></tr>
<tr><td><code>routes/*.js</code></td><td>Có những endpoint nào</td></tr>
<tr><td><code>middleware/*.js</code></td><td>Điều gì xảy ra với <em>mọi</em> request trong nhóm</td></tr>
</tbody></table>
<p>Khi dự án lớn thêm, bước tách tiếp theo thường là <code>services/</code>: route chỉ còn lo đọc request và trả response, còn quy tắc nghiệp vụ dọn sang service. Chương "Kiến trúc ứng dụng" sẽ nói kỹ; ở quy mô một ứng dụng todo thì chưa cần.</p>
<p class="callout">Một file <code>.rest</code> kèm theo dự án là thói quen rất đáng học từ khoá này. Nó là tài liệu API <em>chạy được</em>: người mới vào dự án bấm một nút là gọi thử được endpoint, không phải đọc code để đoán ra hình dạng body.</p>`,
      check: { type: 'quiz', q: 'Vì sao .env.example được commit lên Git còn .env thì không?',
        options: ['Vì .env quá nặng',
          'Vì .env chứa giá trị bí mật thật, còn .env.example chỉ liệt kê TÊN biến để người mới biết cần điền gì',
          'Vì Git không hỗ trợ file bắt đầu bằng dấu chấm',
          'Vì .env được sinh tự động khi chạy npm install'],
        answer: 1,
        explain: 'Đẩy khoá bí mật lên GitHub là coi như đã lộ, kể cả khi bạn xoá commit sau đó — lịch sử Git vẫn giữ và các công cụ quét tự động tìm thấy trong vài phút. .env.example giải quyết vấn đề còn lại: người mới clone dự án vẫn biết cần khai báo những biến nào.' }
    }
  ]
},
{
  id: 'n6', title: 'SQLite và SQL trong Node',
  summary: 'Database gọn nhẹ có sẵn trong Node: tạo bảng, bốn câu lệnh, prepare và khoá ngoại.',
  lessons: [
    {
      id: 'n6l1', title: 'node:sqlite — database không cần cài',
      body: `
<p>Học backend mà phải cài PostgreSQL trước thì nhiều người bỏ cuộc ngay ở bước đó. <strong>SQLite</strong> giải quyết chuyện này: cả database chỉ là <em>một file</em>, và từ Node 22 thì nó có sẵn trong Node, không cần cài gì thêm.</p>
<pre><code>import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync(':memory:')</code></pre>
<p><code>':memory:'</code> nghĩa là database sống trong RAM và <strong>biến mất khi tắt server</strong>. Rất tiện để học và để test — mỗi lần chạy là một bảng sạch. Muốn giữ lại thì đưa vào một đường dẫn file: <code>new DatabaseSync('./todo.db')</code>.</p>
<table><thead><tr><th></th><th>SQLite</th><th>PostgreSQL</th></tr></thead><tbody>
<tr><td>Cài đặt</td><td>Không cần</td><td>Cài server, tạo user, tạo database</td></tr>
<tr><td>Lưu ở</td><td>Một file</td><td>Một tiến trình riêng</td></tr>
<tr><td>Ghi đồng thời</td><td>Một lúc một người</td><td>Nhiều người cùng lúc</td></tr>
<tr><td>Kiểu dữ liệu</td><td>5 kiểu, khá lỏng</td><td>Nhiều kiểu, chặt chẽ</td></tr>
<tr><td>Hợp với</td><td>Học, thử nghiệm, ứng dụng nhỏ, ứng dụng máy để bàn</td><td>Ứng dụng nhiều người dùng</td></tr>
</tbody></table>
<p>Chữ <code>Sync</code> trong <code>DatabaseSync</code> là cố ý: mọi lệnh đều <strong>đồng bộ</strong>, không cần <code>await</code>. Đọc một file trên ổ đĩa nhanh tới mức không đáng để bất đồng bộ. Nhưng cũng vì vậy, một truy vấn nặng sẽ chặn cả event loop — chi tiết này sẽ quay lại làm phiền bạn khi ứng dụng lớn lên, và là một lý do để chuyển sang PostgreSQL.</p>`,
      check: { type: 'quiz', q: 'Bạn dùng new DatabaseSync(":memory:"), đăng ký một tài khoản, rồi khởi động lại server. Đăng nhập lại thì báo "User not found". Vì sao?',
        options: ['Vì mật khẩu được băm nên không so sánh lại được',
          'Vì database nằm trong RAM, tắt tiến trình là toàn bộ dữ liệu biến mất',
          'Vì token đã hết hạn',
          'Vì thiếu PRAGMA foreign_keys'],
        answer: 1,
        explain: '":memory:" tạo database trong bộ nhớ của tiến trình. Khởi động lại là chạy lại db.exec("CREATE TABLE...") trên một database trống tinh. Muốn giữ dữ liệu thì truyền vào đường dẫn file.' }
    },
    {
      id: 'n6l2', title: 'CREATE TABLE và các ràng buộc',
      body: `
<p>Hai bảng của ứng dụng todo, viết nguyên văn như trong <code>db.js</code>:</p>
<pre><code>db.exec(\`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
\`)

db.exec(\`
    CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        task TEXT,
        completed BOOLEAN DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
\`)</code></pre>
<p>Từng ràng buộc làm một việc rất cụ thể:</p>
<table><thead><tr><th>Ràng buộc</th><th>Database đảm bảo điều gì</th></tr></thead><tbody>
<tr><td><code>PRIMARY KEY</code></td><td>Cột này định danh dòng, không trùng, không rỗng</td></tr>
<tr><td><code>AUTOINCREMENT</code></td><td>Không khai thì database tự cấp số tiếp theo</td></tr>
<tr><td><code>UNIQUE</code></td><td>Không có hai dòng cùng giá trị — hai tài khoản không thể trùng username</td></tr>
<tr><td><code>NOT NULL</code></td><td>Bắt buộc có giá trị</td></tr>
<tr><td><code>DEFAULT x</code></td><td>Không khai thì lấy x</td></tr>
<tr><td><code>FOREIGN KEY</code></td><td>Giá trị phải tồn tại ở bảng kia</td></tr>
</tbody></table>
<p>Vì sao đặt ràng buộc ở database thay vì kiểm tra trong code? Vì code có nhiều đường vào — route đăng ký, script nhập liệu, một lần sửa tay bằng lệnh SQL — còn database thì chỉ có một. Ràng buộc <code>UNIQUE</code> trên <code>username</code> là <em>lời hứa cuối cùng</em>, giữ được ngay cả khi hai request đăng ký cùng một email chạy song song.</p>
<p class="warn">Chữ <code>BOOLEAN</code> ở cột <code>completed</code> chỉ là ghi chú cho người đọc. SQLite không có kiểu boolean; giá trị lưu xuống là số 0 hoặc 1. Đây là lý do <code>todoRoutes.js</code> gửi <code>{ "completed": 1 }</code> chứ không phải <code>true</code>.</p>`,
      check: { type: 'ex', exId: 'node-49' }
    },
    {
      id: 'n6l3', title: 'Bốn câu lệnh, bốn method HTTP',
      body: `
<p>CRUD trong SQL ánh xạ gần như một-một sang HTTP. Đây là lý do REST đọc tự nhiên đến vậy:</p>
<table><thead><tr><th>Việc</th><th>SQL</th><th>HTTP</th></tr></thead><tbody>
<tr><td>Tạo</td><td><code>INSERT INTO todos (user_id, task) VALUES (?, ?)</code></td><td><code>POST /todos</code></td></tr>
<tr><td>Đọc</td><td><code>SELECT * FROM todos WHERE user_id = ?</code></td><td><code>GET /todos</code></td></tr>
<tr><td>Sửa</td><td><code>UPDATE todos SET completed = ? WHERE id = ?</code></td><td><code>PUT /todos/:id</code></td></tr>
<tr><td>Xoá</td><td><code>DELETE FROM todos WHERE id = ? AND user_id = ?</code></td><td><code>DELETE /todos/:id</code></td></tr>
</tbody></table>
<p>Hai chi tiết trong bảng trên đáng dừng lại:</p>
<p><strong>Mọi câu lệnh đọc đều có <code>WHERE user_id = ?</code>.</strong> Không phải để lọc cho gọn — mà để một người không đọc được todo của người khác. Điều kiện này không phải tuỳ chọn; thiếu nó là lỗ hổng.</p>
<p><strong>Câu <code>DELETE</code> có hai điều kiện</strong>, cả <code>id</code> lẫn <code>user_id</code>. Chỉ dùng <code>WHERE id = ?</code> thì ai cũng xoá được todo của người khác chỉ bằng cách đổi số trên URL. Lỗ hổng này có tên: <strong>IDOR</strong> — truy cập trực tiếp tới đối tượng bằng cách đoán định danh.</p>
<p class="warn">Để ý câu <code>UPDATE</code> trong dự án gốc: <code>UPDATE todos SET completed = ? WHERE id = ?</code> — nó <em>thiếu</em> <code>AND user_id = ?</code>. Đây là một lỗ hổng IDOR có thật trong mã nguồn của khoá học. Khi tự làm lại, hãy thêm điều kiện đó vào.</p>
<p>Còn <code>DELETE FROM todos</code> mà quên hẳn mệnh đề <code>WHERE</code> thì xoá sạch bảng, không hỏi lại câu nào.</p>`,
      check: { type: 'ex', exId: 'node-50' }
    },
    {
      id: 'n6l4', title: 'prepare, và vì sao có dấu hỏi',
      body: `
<p>Mọi truy vấn trong dự án đều đi theo hai bước:</p>
<pre><code>const insertTodo = db.prepare('INSERT INTO todos (user_id, task) VALUES (?, ?)')
const result = insertTodo.run(req.userId, task)</code></pre>
<p><code>prepare</code> biên dịch câu lệnh và trả về một <em>statement</em>; <code>run</code> mới thực sự chạy nó với các giá trị. Ba method để chạy:</p>
<table><thead><tr><th>Method</th><th>Trả về</th><th>Dùng cho</th></tr></thead><tbody>
<tr><td><code>.run(...)</code></td><td><code>{ changes, lastInsertRowid }</code></td><td>INSERT, UPDATE, DELETE</td></tr>
<tr><td><code>.get(...)</code></td><td>Một dòng, hoặc <code>undefined</code></td><td>SELECT một bản ghi</td></tr>
<tr><td><code>.all(...)</code></td><td>Mảng các dòng</td><td>SELECT danh sách</td></tr>
</tbody></table>
<p><code>lastInsertRowid</code> là giá trị dùng ngay sau khi đăng ký, để tạo todo đầu tiên cho người dùng vừa tạo:</p>
<pre><code>const result = insertUser.run(username, hashedPassword)
insertTodo.run(result.lastInsertRowid, 'Hello :) Add your first todo!')</code></pre>
<p>Bây giờ tới phần quan trọng nhất: <strong>vì sao dùng dấu hỏi thay vì nối chuỗi</strong>. Hãy so sánh hai cách viết:</p>
<pre><code>// TUYỆT ĐỐI KHÔNG
db.exec("SELECT * FROM users WHERE username = '" + username + "'")

// ĐÚNG
db.prepare('SELECT * FROM users WHERE username = ?').get(username)</code></pre>
<p>Với cách thứ nhất, người dùng nhập <code>' OR 1=1 --</code> vào ô username. Câu lệnh trở thành <code>SELECT * FROM users WHERE username = '' OR 1=1 --'</code>, điều kiện luôn đúng, và họ đăng nhập thành công với tư cách người dùng đầu tiên trong bảng.</p>
<p>Với cách thứ hai, database <strong>biên dịch câu lệnh trước</strong>, rồi mới đưa giá trị vào chỗ trống. Chuỗi kia được so sánh nguyên văn như một username bình thường — không có cách nào để nó biến thành lệnh, vì lúc nó tới thì cấu trúc câu lệnh đã cố định rồi.</p>
<p class="callout">Đây là toàn bộ lý do tham số hoá tồn tại, và nó là hàng phòng thủ <em>duy nhất</em> đáng tin. Lọc ký tự bằng tay luôn sót. Nhưng nhớ: chỉ <strong>giá trị</strong> mới tham số hoá được — tên bảng và tên cột là một phần cấu trúc, phải tự kiểm tra bằng danh sách cho phép.</p>`,
      check: { type: 'ex', exId: 'node-51' }
    },
    {
      id: 'n6l5', title: 'Khoá ngoại và quan hệ một–nhiều',
      body: `
<p>Một người dùng có nhiều todo; mỗi todo thuộc về đúng một người. Đó là quan hệ <strong>một–nhiều</strong>, và SQL thể hiện nó bằng một cột ở bảng "nhiều":</p>
<pre>users                    todos
┌────┬──────────┐        ┌────┬─────────┬───────────┐
│ id │ username │        │ id │ user_id │ task      │
├────┼──────────┤        ├────┼─────────┼───────────┤
│ 10 │ kiet     │◄───────│  1 │      10 │ học SQL   │
│ 11 │ an       │◄──┐    │  2 │      10 │ viết API  │
└────┴──────────┘   └────│  3 │      11 │ đọc sách  │
                         └────┴─────────┴───────────┘</pre>
<p>Cột <code>user_id</code> gọi là <strong>khoá ngoại</strong>. Dòng <code>FOREIGN KEY(user_id) REFERENCES users(id)</code> nói với database: giá trị ở cột này phải tồn tại bên bảng <code>users</code>.</p>
<p>Có một cái bẫy lớn ở đây: <strong>SQLite mặc định không kiểm tra khoá ngoại</strong>. Vì lý do tương thích ngược, bạn phải bật nó lên:</p>
<pre><code>db.exec('PRAGMA foreign_keys = ON')</code></pre>
<p>Quên dòng này thì database vui vẻ nhận những todo trỏ tới user không tồn tại. Không có lỗi nào cả — và bạn chỉ phát hiện ra vài tuần sau, khi một báo cáo cho ra con số vô lý.</p>
<p>Khoá ngoại bật rồi còn quyết định điều gì xảy ra khi xoá bản ghi cha:</p>
<ul>
<li><code>ON DELETE CASCADE</code> — xoá user thì xoá luôn todo của họ</li>
<li><code>ON DELETE RESTRICT</code> — không cho xoá user khi còn todo</li>
<li>Mặc định — cũng là từ chối xoá</li>
</ul>
<p>Với todo thì <code>CASCADE</code> hợp lý: người dùng xoá tài khoản thì việc riêng của họ đi theo. Với đơn hàng và sản phẩm thì ngược lại — xoá sản phẩm không được phép làm bốc hơi lịch sử mua hàng.</p>`,
      check: { type: 'ex', exId: 'node-52' }
    }
  ]
}
];
