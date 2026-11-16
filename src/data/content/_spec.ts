/**
 * 内容文件编写规范（供内容生成参考，不参与运行）
 *
 * 每个 content/*.ts 文件导出两个数组：
 *   export const knowledgePoints: KnowledgePoint[]
 *   export const questions: Question[]
 *
 * 类型定义见 src/db/types.ts。
 *
 * ID 约定：
 *   知识点：kp-{科目缩写}{年级数字}-{序号}，如 kp-m7-1 / kp-p8-1 / kp-c9-1
 *   题目：  q-{科目缩写}{年级数字}-{序号}，如 q-m7-1
 *
 * 密度要求：
 *   每个知识点：1 个 examples（含 3 步 steps）+ 2 条 mistakes + 5 道 questions
 *   中考重点章节（见各任务说明）：每点 8–10 道 questions
 *
 * 每题 4 个 options，answerIndex 0–3，explanation 一句话讲清关键。
 * 题目难度 basic/advanced/challenge 混合，约 4:3:2。
 */
export {}
