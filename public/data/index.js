/**
 * Gom toàn bộ nội dung thành một điểm nhập duy nhất.
 * Cả trình duyệt và server đều import từ đây, nên nội dung chỉ tồn tại một bản.
 */
import chapters0105 from './theory/chapters-01-05.js';
import chapters0610 from './theory/chapters-06-10.js';
import chapters1115 from './theory/chapters-11-15.js';
import nodeExercises from './exercises/node.js';
import dotnetExercises from './exercises/dotnet.js';
import glossary from './reference/glossary.js';
import roadmap from './reference/roadmap.js';
import libraries from './reference/libraries.js';

export const THEORY = [...chapters0105, ...chapters0610, ...chapters1115];
export const EXERCISES = [...nodeExercises, ...dotnetExercises];
export const GLOSSARY = glossary;
export const ROADMAP = roadmap;
export const LIBRARIES = libraries;
