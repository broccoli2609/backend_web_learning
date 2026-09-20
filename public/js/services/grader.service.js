/**
 * SERVICE — Chấm bài bằng Claude.
 *
 * Có những bài không chạy test được trong trình duyệt: code C#, và cả những
 * file cấu hình như Dockerfile hay schema.prisma. Những bài đó được chấm bằng
 * cách đưa đề bài, danh sách tiêu chí và bài làm cho Claude đọc.
 * Bài JavaScript có test thì chạy test thật; Claude ở đó chỉ để nhận xét.
 */
import { claudeService } from './claude.service.js';
import { stripTags } from '../models/content.model.js';

const MAX_CODE_CHARS = 12000;

/** Nhãn nền tảng và tên ngôn ngữ cho khối code trong prompt. */
function contextOf(exercise) {
  if (exercise.lang === 'dotnet') return { subject: 'ASP.NET Core', fence: 'csharp' };
  return { subject: `Node.js (file ${exercise.file ?? 'solution.js'})`, fence: exercise.syntax ?? 'javascript' };
}

function buildGradingPrompt(exercise, code) {
  const rubric = (exercise.rubric ?? []).map((item, i) => `${i + 1}. ${item}`).join('\n');
  const { subject, fence } = contextOf(exercise);

  return [
    `Bạn là giám khảo chấm bài tập ${subject} cho một người mới học backend.`,
    'Chấm nghiêm túc nhưng khích lệ, viết hoàn toàn bằng tiếng Việt.',
    '',
    `ĐỀ BÀI: ${exercise.title}`,
    `YÊU CẦU: ${stripTags(exercise.brief)}`,
    '',
    'TIÊU CHÍ CHẤM:',
    rubric,
    '',
    'BÀI LÀM CỦA HỌC VIÊN:',
    '```' + fence,
    code.slice(0, MAX_CODE_CHARS),
    '```',
    '',
    'Chấm từng tiêu chí ở trên. Trả về CHỈ một đối tượng JSON, không kèm lời dẫn:',
    '{"passed": true, "score": 85, "criteria": [{"name": "tiêu chí 1", "ok": true, "note": "một câu ngắn"}], "summary": "2-3 câu nhận xét", "improvements": ["gợi ý cụ thể"]}',
    '',
    'Quy tắc: passed = true khi đạt ít nhất 80% tiêu chí và không có lỗi bảo mật hay lỗi logic nghiêm trọng.',
    '"name" giữ nguyên nội dung tiêu chí. "note" tối đa một câu.',
    '"improvements" tối đa 3 mục, cụ thể và làm được ngay.',
    'Nếu bài làm bỏ trống hoặc không liên quan tới đề, trả passed = false, score = 0 và nói rõ trong summary.'
  ].join('\n');
}

function buildReviewPrompt(exercise, code) {
  return [
    'Bạn là người hướng dẫn backend, nhận xét code của một người mới học.',
    'Viết bằng tiếng Việt, ngắn gọn, tối đa 180 từ.',
    '',
    `ĐỀ BÀI: ${exercise.title}`,
    `YÊU CẦU: ${stripTags(exercise.brief)}`,
    '',
    'BÀI LÀM (JavaScript):',
    '```js',
    code.slice(0, 8000),
    '```',
    '',
    'Bài đã qua hết test. Hãy nhận xét ba điểm:',
    '(1) điều làm tốt,',
    '(2) điều nên sửa về cách viết hoặc trường hợp biên,',
    '(3) một điều liên quan tới thực tế backend mà bài tập này phản ánh.',
    'Không viết lại toàn bộ code; chỉ trích đoạn ngắn khi cần.'
  ].join('\n');
}

/** Dọn kết quả Claude trả về để view không phải phòng thủ. */
function normalizeGrade(raw) {
  const criteria = Array.isArray(raw?.criteria)
    ? raw.criteria.map((c) => ({
        name: String(c?.name ?? ''),
        ok: Boolean(c?.ok),
        note: c?.note ? String(c.note) : ''
      }))
    : [];

  return {
    passed: Boolean(raw?.passed),
    score: Number.isFinite(raw?.score) ? Math.max(0, Math.min(100, Math.round(raw.score))) : null,
    criteria,
    summary: raw?.summary ? String(raw.summary) : '',
    improvements: Array.isArray(raw?.improvements) ? raw.improvements.map(String).slice(0, 3) : []
  };
}

export const graderService = {
  available: () => claudeService.hasSample(),

  async grade(exercise, code) {
    const raw = await claudeService.askForJson(buildGradingPrompt(exercise, code));
    return normalizeGrade(raw);
  },

  review(exercise, code, onText) {
    return claudeService.askForText(buildReviewPrompt(exercise, code), { onText });
  }
};
