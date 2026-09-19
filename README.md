# Xưởng Backend

Trang web tự học backend cho **Node.js / Express** và **ASP.NET Core Web API** — và bản thân nó cũng là một ví dụ về những thứ nó dạy: frontend tách Model–View–Controller, server Express xếp lớp Routes → Controllers → Services → Models.

- 15 chương lý thuyết, 52 bài học — mỗi bài kết thúc bằng một câu hỏi hoặc một bài code
- 50 bài tập: 25 bài Node.js chạy test thật trong trình duyệt, 25 bài ASP.NET Core chấm theo tiêu chí
- Lộ trình 5 giai đoạn có checklist, từ điển 70 thuật ngữ, bảng phiên bản thư viện
- 17 integration test cho API, 143 test cho ngân hàng bài tập

---

## Chạy

```bash
npm install
npm run dev      # server Express, có tự khởi động lại khi sửa code
```

Mở http://localhost:3000.

Không muốn chạy server thì mở riêng phần tĩnh — trang vẫn đầy đủ, chỉ là tiến độ lưu trong trình duyệt:

```bash
npm run static   # http://localhost:5173
```

Cấu hình đọc từ biến môi trường, xem [`.env.example`](.env.example):

```bash
cp .env.example .env
node --env-file=.env server/server.js
```

## Kiểm thử

```bash
npm test               # chạy cả ba bước dưới
npm run check          # id trùng, tham chiếu hỏng, quiz sai đáp án
npm run test:exercises # 25 lời giải mẫu qua 143 test của chính chúng
npm run test:api       # 17 integration test cho API
```

`test:api` dựng server bằng `createApp()` trên một cổng ngẫu nhiên và ghi tiến độ vào thư mục tạm, nên chạy được song song và không đụng dữ liệu thật.

---

## Cấu trúc

```
.
├── public/                        FRONTEND — chạy tĩnh được, không cần build
│   ├── index.html
│   ├── assets/styles.css
│   ├── data/                      NỘI DUNG — server và trình duyệt dùng chung
│   │   ├── index.js               gom tất cả thành một điểm nhập
│   │   ├── theory/                15 chương, chia ba file
│   │   ├── exercises/             node.js và dotnet.js
│   │   └── reference/             glossary, roadmap, libraries
│   └── js/
│       ├── main.js                điểm vào: khởi động, đăng ký route
│       ├── models/                DỮ LIỆU VÀ TRẠNG THÁI
│       │   ├── content.model.js   tra cứu lý thuyết, bài tập, thuật ngữ
│       │   ├── progress.model.js  tiến độ và nơi lưu nó
│       │   └── library.model.js   bảng phiên bản thư viện
│       ├── views/                 CHỈ SINH HTML, không gắn sự kiện
│       │   ├── components.view.js mảnh dùng chung: chip, pill, thanh tiến độ
│       │   ├── layout.view.js     thanh điều hướng
│       │   ├── home.view.js
│       │   ├── theory.view.js
│       │   ├── exercise.view.js
│       │   └── reference.view.js
│       ├── controllers/           NỐI HAI BÊN, xử lý sự kiện
│       │   ├── router.js          đọc hash, chọn controller, vẽ
│       │   ├── home.controller.js
│       │   ├── theory.controller.js
│       │   ├── exercise.controller.js
│       │   ├── reference.controller.js
│       │   └── events.js          kênh tín hiệu nhỏ giữa các controller
│       └── services/              VIỆC BẨN: mạng, worker, Claude
│           ├── test-runner.service.js  chạy test trong Web Worker
│           ├── grader.service.js       dựng prompt chấm bài
│           ├── claude.service.js       gói window.claude
│           ├── api.service.js          gọi API server
│           └── theme.service.js
│
├── server/                        BACKEND — Express theo MVC
│   ├── server.js                  điểm vào: cấu hình, lắng nghe, tắt êm
│   ├── app.js                     lắp middleware đúng thứ tự
│   ├── config/index.js            đọc biến môi trường, chết sớm nếu thiếu
│   ├── routes/                    ánh xạ URL → controller
│   ├── controllers/               đọc request, gọi service, chọn status code
│   ├── services/                  quy tắc nghiệp vụ, không biết gì về HTTP
│   ├── models/                    truy cập dữ liệu: nội dung và tiến độ
│   ├── middlewares/               traceId, CORS, validate, 404, xử lý lỗi
│   └── utils/                     AppError, asyncHandler
│
└── scripts/                       check-content, verify-exercises, api.test
```

### Vì sao chia như vậy

Ba quy tắc, áp dụng cho cả hai bên:

| Lớp | Được làm | Không được làm |
| --- | --- | --- |
| Controller | Đọc đầu vào, gọi service, chọn status code | Viết truy vấn, chứa quy tắc nghiệp vụ |
| Service | Quy tắc nghiệp vụ | Chạm tới `req`/`res`, tới DOM |
| Model | Đọc ghi dữ liệu | Chứa quy tắc nghiệp vụ |

Phép thử nhanh: nếu bạn phải dựng một HTTP server để test quy tắc "size tối đa là 100", thì quy tắc đó đang nằm sai chỗ. Ở đây nó nằm trong `server/services/content.service.js` và test gọi thẳng vào được.

---

## API

Tất cả nằm dưới `/api`. Lỗi luôn cùng một hình dạng: `{ type, message, details, traceId }`.

| Method | Đường dẫn | Việc |
| --- | --- | --- |
| GET | `/api/health` | Trạng thái tổng, kèm từng phụ thuộc |
| GET | `/api/health/live` | Liveness — nhẹ, không chạm ổ đĩa |
| GET | `/api/health/ready` | Readiness — có kiểm tra nơi lưu trữ |
| GET | `/api/content/theory` | Danh sách chương và bài học |
| GET | `/api/content/theory/lessons/:lessonId` | Một bài học |
| GET | `/api/content/exercises` | Danh sách, có `lang` `level` `topic` `q` `page` `size` |
| GET | `/api/content/exercises/:id` | Chi tiết, **không** kèm lời giải |
| GET | `/api/content/exercises/:id/solution` | Lời giải mẫu, hỏi riêng |
| GET | `/api/content/glossary?q=` | Thuật ngữ |
| GET | `/api/content/roadmap` | Lộ trình |
| GET | `/api/libraries` | Bảng phiên bản thư viện |
| GET | `/api/progress/:userId` | Tiến độ kèm phần tổng kết |
| PUT | `/api/progress/:userId` | Ghi đè toàn bộ tiến độ |
| GET | `/api/progress/:userId/submissions` | Lịch sử nộp bài |
| POST | `/api/progress/:userId/exercises/:exerciseId` | Ghi một lần nộp bài |

Mọi response đều có header `X-Trace-Id`; mã đó cũng nằm trong mọi dòng log của chính request ấy.

```bash
curl -s localhost:3000/api/health | jq
curl -s "localhost:3000/api/content/exercises?lang=node&level=Nâng%20cao" | jq '.items[].title'
```

### Điều còn thiếu, cố ý

`userId` lấy thẳng từ URL, nên ai biết id cũng đọc ghi được tiến độ của id đó — **đúng lỗ hổng IDOR mà chương 6 mô tả**. Bản demo để vậy cho dễ chạy. Khi bạn thêm đăng nhập, sửa ba chỗ:

1. Thêm middleware xác thực, gắn `req.user` từ token
2. Trong `server/controllers/progress.controller.js`, dùng `req.user.id` thay cho `req.params.userId`
3. Bỏ `:userId` khỏi đường dẫn trong `server/routes/progress.routes.js`

Đó là một bài tập tốt sau khi học xong chương 6.

---

## Tiến độ được lưu ở đâu

Theo thứ tự ưu tiên, cái nào có thì dùng:

1. **Database của Claude Artifact** — theo tài khoản, đồng bộ giữa các máy
2. **API của server** — theo id lưu trong `localStorage`, file JSON trong `server/storage/`
3. **`localStorage`** — chỉ trong trình duyệt này

`localStorage` luôn được ghi kèm, nên mất mạng hay tắt server vẫn không mất dữ liệu. Thanh bên hiển thị đang lưu ở đâu.

Xoá sạch tiến độ: DevTools → Application → Local Storage → xoá `xuong-backend-progress-v1`; và xoá thư mục `server/storage/` nếu chạy server.

---

## Thêm nội dung

Mọi nội dung nằm trong `public/data/`. Thêm bài không phải sửa một dòng nào trong `js/` hay `server/`.

### Thêm bài tập Node.js

Code của người học chạy trong Web Worker riêng, giới hạn 5 giây, nên vòng lặp vô tận chỉ treo worker chứ không treo trang. Thêm vào `public/data/exercises/node.js`:

```js
{
  id: 'node-26',
  lang: 'node',
  level: 'Trung bình',        // Cơ bản | Trung bình | Nâng cao
  topic: 'HTTP',
  fn: 'parseAuthHeader',      // tên hàm người học phải viết
  title: 'Đọc header Authorization',
  brief: '<p>Mô tả đề bài, chấp nhận HTML.</p>',
  starter: 'function parseAuthHeader(header) {\n  // Viết code ở đây\n}',
  hints: ['Gợi ý thứ nhất'],
  tests: [
    { label: 'token hợp lệ', args: ['Bearer abc'], expect: { scheme: 'Bearer', token: 'abc' } },
    { label: 'header rỗng', args: [''], expect: null }
  ],
  solution: 'function parseAuthHeader(header) { /* ... */ }'
}
```

Hai kiểu test:

| Kiểu | Khi nào dùng | Cách viết |
| --- | --- | --- |
| `args` + `expect` | Hàm thuần, gọi một lần | `{ label, args: [...], expect: ... }` |
| `script` + `expect` | Hàm trả về closure, factory, cần nhiều bước | `{ label, script: 'const c = fn(...); c(1); return c(2);', expect: ... }` |

Thêm `async: true` khi kết quả là Promise. Trong `script`, biến `fn` chính là hàm người học viết. So sánh dùng deep equal: thứ tự khoá không quan trọng, số lượng khoá thì có.

Chạy `npm run test:exercises` — nó bắt ngay nếu lời giải mẫu và bộ test không khớp.

### Thêm bài tập ASP.NET Core

C# không chạy được trong trình duyệt, nên bài .NET chấm theo **rubric** — danh sách tiêu chí mà Claude đọc code rồi đánh dấu từng mục. Thêm vào `public/data/exercises/dotnet.js`:

```js
{
  id: 'net-26',
  lang: 'dotnet',
  level: 'Trung bình',
  topic: 'EF Core',
  title: 'Cấu hình soft delete',
  brief: '<p>Mô tả đề bài.</p>',
  starter: '// code khởi đầu',
  hints: ['...'],
  rubric: [
    'Dùng HasQueryFilter để lọc bản ghi đã xoá',
    'Ghi đè SaveChangesAsync để đánh dấu thay vì xoá thật'
  ],
  solution: '// lời giải mẫu'
}
```

Viết rubric thành những mục **kiểm chứng được bằng mắt khi đọc code**. "Code sạch" là tiêu chí tồi; "Repository nhận CancellationToken ở mọi phương thức async" là tiêu chí tốt.

### Thêm bài học

Trong `public/data/theory/`, mỗi chương có mảng `lessons`. Mỗi bài bắt buộc có phần kiểm tra cuối bài:

```js
{
  id: 'c2l5',
  title: 'Tên bài học',
  body: '<p>Nội dung, chấp nhận HTML đầy đủ.</p>',

  // cách 1 — trắc nghiệm
  check: {
    type: 'quiz',
    q: 'Câu hỏi?',
    options: ['A', 'B', 'C', 'D'],
    answer: 2,                    // chỉ số bắt đầu từ 0
    explain: 'Vì sao đáp án đó đúng, và vì sao các đáp án kia sai.'
  }

  // cách 2 — trỏ tới một bài code
  // check: { type: 'ex', exId: 'node-04' }
}
```

Bài học chỉ tính là xong khi trả lời đúng quiz hoặc làm đạt bài tập tương ứng. Trong `body` có sẵn hai class: `.callout` (khung nhấn mạnh) và `.warn` (khung cảnh báo); bảng tự được bọc khung cuộn ngang nên không vỡ layout trên điện thoại.

---

## Chấm bài bằng Claude

Nút "Nộp bài cho Claude chấm" và "Nhờ Claude nhận xét" chỉ hoạt động khi trang chạy bên trong Claude Artifact. Ở bản tự host, `claude.service.js` trả về rỗng và giao diện nói rõ điều đó — test Node.js vẫn chạy bình thường.

Muốn tự chấm bài C#: thêm một endpoint ở `server/` gọi API của một mô hình ngôn ngữ, rồi sửa `graderService.grade` trong `public/js/services/grader.service.js` để gọi tới đó. **Đừng đặt API key trong code frontend** — ai mở DevTools cũng đọc được; key phải nằm ở server, đọc từ biến môi trường.

## Bảng phiên bản thư viện

`public/data/reference/libraries.js` là dữ liệu đi kèm, luôn hiển thị được. Server phục vụ chính file đó qua `GET /api/libraries`. Bản chạy trong Claude Artifact ưu tiên đọc từ database, nơi một tác vụ định kỳ hàng tuần ghi phiên bản mới nhất vào.

Muốn tự động ở bản tự host: viết một GitHub Action chạy theo lịch, gọi `https://registry.npmjs.org/-/package/<tên>/dist-tags` và `https://api.nuget.org/v3-flatcontainer/<tên>/index.json`, rồi commit lại file đó.

---

## Deploy

Dự án có hai hình dạng deploy. Chọn theo việc bạn cần gì, không cần làm cả hai.

| | Bản tĩnh | Bản có server |
| --- | --- | --- |
| Deploy cái gì | Chỉ `public/` | Cả repo |
| Chi phí | Miễn phí | Miễn phí (có giới hạn) hoặc ~2 USD/tháng |
| Mở trang | Tức thì | Chờ ~1 phút nếu server đang ngủ (gói free) |
| Tiến độ học | Lưu riêng từng trình duyệt | Lưu trên server, nhưng cần đĩa lưu lâu dài mới giữ được |
| Có API | Không | Có |

### A. Bản tĩnh lên GitHub Pages

Repo đã có sẵn `.github/workflows/deploy-pages.yml`. Nó chạy test trước, test xanh mới deploy.

**Bước 1 — bật Pages.** Vào repo trên GitHub → **Settings** → **Pages** (cột trái). Ở mục **Source**, chọn **GitHub Actions**. Không chọn "Deploy from a branch" — cách đó không chạy được test và không trỏ vào `public/` được.

Bước này chỉ làm một lần cho mỗi repo.

**Bước 2 — push.**

```bash
git push
```

Push lên `main` là workflow tự chạy. Không cần bấm gì thêm.

**Bước 3 — xem nó chạy.** Vào tab **Actions** của repo. Bạn sẽ thấy hai ô nối nhau: `Chạy test` rồi `Deploy lên GitHub Pages`. Bấm vào để xem log từng bước — đây là chỗ đọc khi có lỗi.

Lần đầu mất khoảng 1–2 phút.

**Bước 4 — mở trang.** Khi ô deploy chuyển xanh, địa chỉ hiện ngay trong đó, dạng:

```
https://<tên-github>.github.io/<tên-repo>/
```

Từ giờ mỗi lần `git push`, trang tự cập nhật. Không phải làm lại bước nào.

**Nếu workflow đỏ:** mở log ở tab Actions, tìm bước đầu tiên có dấu ✗. Lỗi hay gặp nhất là test không qua — nghĩa là bạn sửa nội dung mà quên chạy `npm test` ở máy trước khi push.

### B. Bản có server lên Render

Repo đã có sẵn `render.yaml` khai báo toàn bộ cấu hình.

**Bước 1 — tạo tài khoản** ở [render.com](https://render.com), đăng nhập bằng GitHub để Render đọc được repo.

**Bước 2 — tạo service.** Bấm **New** → **Blueprint** → chọn repo này. Render đọc `render.yaml` và điền sẵn mọi thứ: chạy `npm ci`, khởi động bằng `npm start`, vùng Singapore, health check ở `/api/health/live`.

**Bước 3 — xem log khởi động.** Render dựng xong sẽ in log. Dòng bạn cần thấy:

```
Server chạy ở http://localhost:10000 (production)
```

**Bước 4 — kiểm tra bằng health check** trước khi mở trang:

```bash
curl https://<tên-service>.onrender.com/api/health
```

Trả về `"status": "healthy"` là server sống và đọc được nơi lưu trữ.

**Bước 5 — sửa CORS_ORIGINS.** Sau khi biết địa chỉ thật, vào service → **Environment** → sửa `CORS_ORIGINS` thành đúng địa chỉ đó. Không sửa thì trình duyệt chặn request từ trang khác origin.

**Hai giới hạn của gói free**, biết trước để khỏi tưởng hỏng:

- Service **ngủ sau 15 phút** không ai truy cập. Lần mở kế tiếp chờ khoảng một phút.
- **Không có đĩa lưu lâu dài.** `server/storage/` bị xoá mỗi lần khởi động lại. Tiến độ vẫn an toàn nhờ bản sao trong `localStorage` của trình duyệt.

Muốn tiến độ thật sự nằm trên server: dùng gói trả phí có disk, hoặc đổi nơi lưu sang database. Trường hợp sau chỉ phải viết lại `server/models/progress.model.js` — đó chính là lý do tầng repository tồn tại.

### Deploy lên chỗ khác

Không có bước build, nên mọi static host đều nhận được `public/`: Netlify, Cloudflare Pages, Vercel. Chỉ cần trỏ thư mục gốc vào `public/`.

Với server, bất kỳ chỗ nào chạy được Node đều dùng chung một công thức:

```bash
npm ci        # cài dependency đúng theo package-lock.json
npm start     # node server/server.js
```

Cộng ba biến môi trường: `NODE_ENV=production`, `PORT` (nhiều nền tảng tự cấp), `CORS_ORIGINS`. Nếu chỗ đó có đĩa lưu lâu dài thì trỏ thêm `STORAGE_DIR` vào đấy.

---

## Giấy phép

MIT — xem [LICENSE](LICENSE).
