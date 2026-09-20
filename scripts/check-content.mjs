/**
 * Kiểm tra tính nhất quán của nội dung: id trùng, tham chiếu hỏng, quiz sai đáp án.
 * Dùng: npm run check
 */
import { THEORY, EXERCISES, GLOSSARY, ROADMAP, LIBRARIES } from '../public/data/index.js';

const problems = [];

const exerciseIds = new Set();
for (const exercise of EXERCISES) {
  if (exerciseIds.has(exercise.id)) problems.push(`Bài tập trùng id: ${exercise.id}`);
  exerciseIds.add(exercise.id);

  if (!exercise.title || !exercise.brief || !exercise.starter || !exercise.solution) {
    problems.push(`${exercise.id}: thiếu trường bắt buộc`);
  }
  // Mọi bài đều phải nói rõ đầu vào: bài Node mô tả chữ ký hàm, bài .NET liệt
  // kê những kiểu đã có sẵn. Thiếu phần này là người học phải ngồi đoán.
  if (!exercise.io) {
    problems.push(`${exercise.id}: thiếu phần mô tả đầu vào (io)`);
  } else if (exercise.lang === 'node') {
    if (!exercise.io.signature) problems.push(`${exercise.id}: io thiếu signature`);
    if (!exercise.io.params?.length) problems.push(`${exercise.id}: io thiếu danh sách tham số`);
    if (!exercise.io.returns) problems.push(`${exercise.id}: io thiếu mô tả giá trị trả về`);
    for (const param of exercise.io.params ?? []) {
      if (param.length !== 3) problems.push(`${exercise.id}: tham số io phải đủ [tên, kiểu, mô tả]`);
    }
  } else if (!exercise.io.given && !exercise.io.note) {
    problems.push(`${exercise.id}: io của bài .NET cần given hoặc note`);
  }

  if (exercise.lang === 'node' && (!exercise.fn || !exercise.tests?.length)) {
    problems.push(`${exercise.id}: bài Node.js phải có fn và tests`);
  }
  if (exercise.lang === 'dotnet' && !exercise.rubric?.length) {
    problems.push(`${exercise.id}: bài .NET phải có rubric`);
  }
}

const lessonIds = new Set();
let lessons = 0;
let quizzes = 0;
let codeChecks = 0;

for (const chapter of THEORY) {
  for (const lesson of chapter.lessons) {
    lessons++;
    if (lessonIds.has(lesson.id)) problems.push(`Bài học trùng id: ${lesson.id}`);
    lessonIds.add(lesson.id);

    if (!lesson.check) {
      problems.push(`${lesson.id}: thiếu phần kiểm tra cuối bài`);
      continue;
    }

    if (lesson.check.type === 'ex') {
      codeChecks++;
      if (!exerciseIds.has(lesson.check.exId)) {
        problems.push(`${lesson.id}: trỏ tới bài tập không tồn tại (${lesson.check.exId})`);
      }
      continue;
    }

    quizzes++;
    const { answer, options, explain } = lesson.check;
    if (!Array.isArray(options) || options.length < 2) {
      problems.push(`${lesson.id}: quiz cần ít nhất 2 đáp án`);
    } else if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      problems.push(`${lesson.id}: chỉ số đáp án đúng nằm ngoài khoảng`);
    }
    if (!explain) problems.push(`${lesson.id}: quiz thiếu phần giải thích`);
  }
}

const nodeCount = EXERCISES.filter((e) => e.lang === 'node').length;
const dotnetCount = EXERCISES.filter((e) => e.lang === 'dotnet').length;

console.log(`Chương: ${THEORY.length} · Bài học: ${lessons} (quiz ${quizzes}, bài code ${codeChecks})`);
console.log(`Bài tập: ${EXERCISES.length} (Node.js ${nodeCount}, ASP.NET Core ${dotnetCount})`);
console.log(
  `Thuật ngữ: ${GLOSSARY.length} · Giai đoạn lộ trình: ${ROADMAP.length} · Thư viện theo dõi: ${LIBRARIES.items.length}`
);

if (problems.length > 0) {
  console.error(`\n✕ ${problems.length} vấn đề:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('\n✓ Nội dung nhất quán');
