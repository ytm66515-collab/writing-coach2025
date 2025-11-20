export interface ExamPrompt {
  title: string;
  material: string;
  question: string;
  guidance: string;
}

export interface ParagraphReview {
  original: string;
  critique: string;
  refined: string;
  wordCount: number;
}

export interface EssayState {
  paragraphs: string[]; // User's raw drafts
  reviews: ParagraphReview[]; // Gemini's feedback and refinements
  currentParagraphIndex: number;
}

export const PARAGRAPH_GUIDES = [
  {
    title: "第一段：起 (破題)",
    desc: "針對題目核心意象進行破題，提出主旨。字數建議：100-150字。",
    goal: "引入題目核心，明確點出文章主軸，製造吸引力。"
  },
  {
    title: "第二段：承 (敘事/經驗)",
    desc: "承接主旨，描寫具體的生活經驗或觀察。字數建議：150-200字。",
    goal: "運用感官描寫，具體化個人經驗，與第一段主旨呼應。"
  },
  {
    title: "第三段：轉 (轉折/深化)",
    desc: "從經驗中提煉出更深層的感悟或轉折。字數建議：150-200字。",
    goal: "挖掘表象背後的意義，展現思考深度與情感層次。"
  },
  {
    title: "第四段：合 (哲理/擴大)",
    desc: "將個人感悟連結到普遍哲理或社會現象。字數建議：100-150字。",
    goal: "由小見大，將情感昇華至普世價值或人生哲理。"
  },
  {
    title: "第五段：結 (收束/餘韻)",
    desc: "總結全文，呼應首段，留下餘韻。字數建議：80-120字。",
    goal: "有力收尾，統整全文情感，給予讀者完整感。"
  }
];