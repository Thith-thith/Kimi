"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileText, Printer, Eye, EyeOff, Sparkles, CheckSquare, Square, Calendar } from "lucide-react";
import { RAW_REACTIONS, RawReaction, getReactionDifficulty } from "./reactions";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Reaction {
  unbalanced: string;
  balanced: string;
  type: "synthesis" | "decomposition" | "singleReplacement" | "doubleReplacement" | "combustion";
  difficulty: "easy" | "medium" | "hard";
  coefficients: number[];
}

const LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  checkBtn: {
    en: "Check Answers",
    zh: "检查答案",
    "zh-Hant": "檢查答案",
    fr: "Vérifier",
    ru: "Проверить",
    fa: "بررسی پاسخ‌ها",
    ur: "چیک کریں",
    tl: "Suriin",
    km: "ពិនិត្យចម្លើយ"
  },
  worksheetTitlePrint: {
    en: "Balancing Chemical Equations Practice",
    zh: "化学方程式配平练习",
    "zh-Hant": "化學方程式配平練習",
    fr: "Équilibrage des équations chimiques",
    ru: "Балансировка химических уравнений",
    fa: "موازنه معادلات شیمیایی",
    ur: "کیمیائی مساوات کو متوازن کرنا",
    tl: "Pagbabalanse ng mga Kemikal na Ekwesyon",
    km: "ការអនុវត្តបង្គ្រប់សមីការគីមី"
  },
  worksheetTitlePractice: {
    en: "Online Practice Mode",
    zh: "在线练习模式",
    "zh-Hant": "線上練習模式",
    fr: "Exercice en ligne",
    ru: "Онлайн-практика",
    fa: "تمرین آنلاین",
    ur: "آن لائن مشق",
    tl: "Online na Pagsasanay",
    km: "របៀបអនុវត្តលើបណ្តាញ"
  },
  worksheetTitleAnswerKey: {
    en: "Answer Key (Teacher Use Only)",
    zh: "答案页（仅供教师使用）",
    "zh-Hant": "答案頁（僅供教師使用）",
    fr: "Corrigé (Enseignants uniquement)",
    ru: "Ответы (Только для учителей)",
    fa: "پاسخنامه (مخصوص دبیران)",
    ur: "جوابات (صرف اساتذہ کے لیے)",
    tl: "Susi ng Sagot (Para sa Guro Lamang)",
    km: "សោរចម្លើយ (សម្រាប់តែគ្រូប៉ុណ្ណោះ)"
  },
  instructionsPrint: {
    en: "Instructions: Write the correct coefficient in the blank spaces to balance each reaction. Write '1' if only one molecule is needed.",
    zh: "说明：在空格内填入正确的系数以配平化学反应。如果只需要一个分子，请填写'1'。",
    "zh-Hant": "說明：在空格內填入正確的係數以配平化學反應。如果只需要一個分子，請填寫'1'。",
    fr: "Instructions : Écrivez le bon coefficient dans les espaces vides pour équilibrer chaque réaction. Écrivez '1' si une seule molécule est nécessaire.",
    ru: "Инструкция: Напишите правильный коэффициент в пустых местах, чтобы сбалансировать каждую реакцию. Напишите «1», если нужна только одна молекула.",
    fa: "دستورالعمل: ضریب صحیح را در فضاهای خالی بنویسید تا هر واکنش موازنه شود. اگر فقط یک مولکول نیاز است, عدد '1' را بنویسید.",
    ur: "ہدایات: ہر تعامل کو متوازن کرنے کے لیے خالی جگہوں پر صحیح ضریب لکھیں۔ اگر صرف ایک مالیکیول کی ضرورت ہو تو '1' لکھیں۔",
    tl: "Mga Instruksyon: Isulat ang tamang coefficient sa mga blangkong espasyo upang ma-balance ang bawat reaksyon. Isulat ang '1' kung isang molekula lang ang kailangan.",
    km: "ការណែនាំ៖ សរសេរមេគុណត្រឹមត្រូវក្នុងចន្លោះទទេដើម្បីបង្គ្រប់ប្រតិកម្មនីមួយៗ។ សរសេរ '1' ប្រសិនបើត្រូវការតែមួយម៉ូលេគុលប៉ុណ្ណោះ។"
  },
  instructionsPractice: {
    en: "Instructions: Fill in the coefficients and click Check Answers. Correct values turn green, incorrect turn red.",
    zh: "说明：填入系数并点击“检查答案”。正确数值变绿，错误变红。",
    "zh-Hant": "說明：填入係數並點擊“檢查答案”。正確數值變綠，錯誤變紅。",
    fr: "Instructions : Remplissez les coefficients et cliquez sur Vérifier. Les valeurs correctes deviennent vertes, les incorrectes rouges.",
    ru: "Инструкция: Введите коэффициенты и нажмите «Проверить». Правильные значения станут зелеными, неправильные — красными.",
    fa: "دستورالعمل: ضرایب را وارد کرده و روی بررسی پاسخ‌ها کلیک کنید. مقادیر صحیح سبز و مقادیر نادرست قرمز می‌شوند.",
    ur: "ہدایات: ضریب بھریں اور چیک کریں پر کلک کریں۔ صحیح اقدار سبز اور غلط سرخ ہو جائیں گی۔",
    tl: "Mga Instruksyon: Ilagay ang coefficients at i-click ang Suriin. Ang mga tamang sagot ay magiging berde, at pula naman kung mali.",
    km: "ការណែនាំ៖ បំពេញមេគុណ រួចចុច 'ពិនិត្យចម្លើយ'។ តម្លៃត្រឹមត្រូវនឹងក្លាយជាពណ៌បៃតង ឯតម្លៃខុសនឹងក្លាយជាពណ៌ក្រហម។"
  },
  today: {
    en: "Today's Date",
    zh: "今日日期",
    "zh-Hant": "今日日期",
    fr: "Date du jour",
    ru: "Сегодня",
    fa: "تاریخ امروز",
    ur: "آج کی تاریخ",
    tl: "Petsa Ngayon",
    km: "កាលបរិច្ឆេទថ្ងៃនេះ"
  },
  fillTodayBtn: {
    en: "Toggle Date",
    zh: "切换日期",
    "zh-Hant": "切換日期",
    fr: "Changer date",
    ru: "Дата сегодня",
    fa: "تغییر تاریخ",
    ur: "تاریخ تبدیل کریں",
    tl: "Toggilin ang Petsa",
    km: "បិទបើកកាលបរិច្ឆេទ"
  },
  name: {
    en: "Name",
    zh: "姓名",
    "zh-Hant": "姓名",
    fr: "Nom",
    ru: "Имя",
    fa: "نام",
    ur: "نام",
    tl: "Pangalan",
    km: "ឈ្មោះ"
  },
  dateLabel: {
    en: "Date",
    zh: "日期",
    "zh-Hant": "日期",
    fr: "Date",
    ru: "Дата",
    fa: "تاریخ",
    ur: "تاریخ",
    tl: "Petsa",
    km: "កាលបរិច្ឆេទ"
  },
  scoreLabel: {
    en: "Score",
    zh: "得分",
    "zh-Hant": "得分",
    fr: "Score",
    ru: "Оценка",
    fa: "امتیاز",
    ur: "اسکور",
    tl: "Iskor",
    km: "ពិន្ទុ"
  },
  questionsCount: {
    en: "questions",
    zh: "题",
    "zh-Hant": "題",
    fr: "questions",
    ru: "вопросов",
    fa: "پرسش",
    ur: "سوالات",
    tl: "tanong",
    km: "សំណួរ"
  },
  hardRatioLabel: {
    en: "Hard Question Ratio",
    zh: "困难题目比例",
    "zh-Hant": "困難題目比例",
    fr: "Ratio de questions difficiles",
    ru: "Доля сложных вопросов",
    fa: "نسبت سوالات سخت",
    ur: "سخت سوالات کا تناسب",
    tl: "Ratio ng Mahirap na Tanong",
    km: "សមាមាត្រសំណួរពិបាក"
  },
  ratio100: {
    en: "100% Hard",
    zh: "100% 困难",
    "zh-Hant": "100% 困難",
    fr: "100% Difficile",
    ru: "100% Сложные",
    fa: "100٪ سخت",
    ur: "100٪ سخت",
    tl: "100% Mahirap",
    km: "ពិបាក ១០០%"
  },
  ratio80: {
    en: "80% Hard / 20% Medium",
    zh: "80% 困难 / 20% 中等",
    "zh-Hant": "80% 困難 / 20% 中等",
    fr: "80% Difficile / 20% Moyen",
    ru: "80% Сложные / 20% Средние",
    fa: "80٪ سخت / 20٪ متوسط",
    ur: "80٪ سخت / 20٪ درمیانہ",
    tl: "80% Mahirap / 20% Katamtaman",
    km: "ពិបាក ៨០% / មធ្យម ២០%"
  },
  ratio50: {
    en: "50% Hard / 50% Medium",
    zh: "50% 困难 / 50% 中等",
    "zh-Hant": "50% 困難 / 50% 中等",
    fr: "50% Difficile / 50% Moyen",
    ru: "50% Сложные / 50% Средние",
    fa: "50٪ سخت / 50٪ متوسط",
    ur: "50٪ سخت / 50٪ درمیانہ",
    tl: "50% Mahirap / 50% Katamtaman"
  },
  ratio30: {
    en: "30% Hard / 70% Medium",
    zh: "30% 困难 / 70% 中等",
    "zh-Hant": "30% 困難 / 70% 中等",
    fr: "30% Difficile / 70% Moyen",
    ru: "30% Сложные / 70% Средние",
    fa: "30٪ سخت / 70٪ متوسط",
    ur: "30٪ سخت / 70٪ درمیانہ",
    tl: "30% Mahirap / 70% Katamtaman"
  },
  q5: {
    en: "5 Questions",
    zh: "5 道题目",
    "zh-Hant": "5 道題目",
    fr: "5 questions",
    ru: "5 вопросов",
    fa: "۵ پرسش",
    ur: "5 سوالات",
    tl: "5 na Tanong"
  },
  q10: {
    en: "10 Questions",
    zh: "10 道题目",
    "zh-Hant": "10 道題目",
    fr: "10 questions",
    ru: "10 вопросов",
    fa: "۱۰ پرسش",
    ur: "10 سوالات",
    tl: "10 na Tanong"
  },
  q15: {
    en: "15 Questions",
    zh: "15 道题目",
    "zh-Hant": "15 道題目",
    fr: "15 questions",
    ru: "15 вопросов",
    fa: "۱۵ پرسش",
    ur: "15 سوالات",
    tl: "15 na Tanong"
  },
  q20: {
    en: "20 Questions",
    zh: "20 道题目",
    "zh-Hant": "20 道題目",
    fr: "20 questions",
    ru: "20 вопросов",
    fa: "۲۰ پرسش",
    ur: "20 سوالات",
    tl: "20 na Tanong"
  }
};

const getLocalTranslation = (key: string, locale: string): string => {
  const dictionary = LOCAL_TRANSLATIONS[key];
  if (!dictionary) return key;
  return dictionary[locale] || dictionary[locale.split("-")[0]] || dictionary["en"] || key;
};

const REACTION_TYPE_SUBTITLES: Record<string, string> = {
  synthesis: "A + B → AB",
  decomposition: "AB → A + B",
  singleReplacement: "A + BC → AC + B",
  doubleReplacement: "AB + CD → AD + CB",
  combustion: "Hydrocarbon + O₂"
};

export default function WorksheetClient() {
  const t = useTranslations("worksheet");
  const locale = useLocale();

  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [hardRatio, setHardRatio] = useState<string>("0.8");
  const [types, setTypes] = useState({
    synthesis: true,
    decomposition: true,
    singleReplacement: true,
    doubleReplacement: true,
    combustion: true
  });

  const [questions, setQuestions] = useState<Reaction[]>([]);
  const [viewMode, setViewMode] = useState<"print" | "practice" | "answer">("print");
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});
  const [showScore, setShowScore] = useState<boolean>(false);
  const [worksheetId, setWorksheetId] = useState<string>("");
  const [worksheetDate, setWorksheetDate] = useState<string>("");

  const handleToggleType = (typeKey: keyof typeof types) => {
    setTypes((prev) => ({ ...prev, [typeKey]: !prev[typeKey] }));
  };

  const generateWorksheetId = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "";
    for (let i = 0; i < 6; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  const handleGenerate = () => {
    const activeTypes = Object.keys(types).filter((k) => types[k as keyof typeof types]) as Array<
      keyof typeof types
    >;
    if (activeTypes.length === 0) {
      alert("Please select at least one reaction type.");
      return;
    }

    // Collect candidates and calculate their dynamic difficulties
    const candidates: Reaction[] = [];
    activeTypes.forEach((typeKey) => {
      const typeTemplates = RAW_REACTIONS.filter((r) => r.type === typeKey);
      typeTemplates.forEach((t) => {
        const leftSide = t.reactants.join(" + ");
        const rightSide = t.products.join(" + ");
        const unbalanced = `${leftSide} -> ${rightSide}`;

        const leftSideBalanced = t.reactants
          .map((r, i) => {
            const coeff = t.coefficients[i];
            return coeff > 1 ? `${coeff}${r}` : r;
          })
          .join(" + ");
        const rightSideBalanced = t.products
          .map((p, i) => {
            const coeff = t.coefficients[t.reactants.length + i];
            return coeff > 1 ? `${coeff}${p}` : p;
          })
          .join(" + ");
        const balanced = `${leftSideBalanced} -> ${rightSideBalanced}`;

        const calculatedDifficulty = getReactionDifficulty(
          t.reactants,
          t.products,
          t.coefficients,
          t.type
        );

        candidates.push({
          unbalanced,
          balanced,
          type: t.type,
          difficulty: calculatedDifficulty,
          coefficients: t.coefficients
        });
      });
    });

    // Helper to select count questions from a specific candidates list, distributing by type
    const selectFromPool = (poolCandidates: Reaction[], count: number): Reaction[] => {
      if (count <= 0) return [];
      let tempPool = poolCandidates;
      if (tempPool.length < count) {
        tempPool = candidates; // Fallback if pool is too small
      }

      if (tempPool.length === 0) {
        return [];
      }

      const shuffledPool = [...tempPool].sort(() => Math.random() - 0.5);
      const selectedList: Reaction[] = [];
      const quotaPerType = Math.ceil(count / activeTypes.length);
      let totalSelected = 0;

      activeTypes.forEach((type) => {
        if (totalSelected >= count) return;
        const typeCandidates = shuffledPool.filter((r) => r.type === type);
        const take = Math.min(quotaPerType, typeCandidates.length, count - totalSelected);
        selectedList.push(...typeCandidates.slice(0, take));
        totalSelected += take;
      });

      // If we still need more, grab from the remainder of the pool
      if (selectedList.length < count) {
        const remainingNeeded = count - selectedList.length;
        const unused = shuffledPool.filter((r) => !selectedList.includes(r));
        selectedList.push(...unused.slice(0, remainingNeeded));
      }

      // Fill with duplicates if pool size is smaller than count
      while (selectedList.length < count) {
        selectedList.push(shuffledPool[Math.floor(Math.random() * shuffledPool.length)]);
      }

      return selectedList;
    };

    let selected: Reaction[] = [];
    if (selectedDifficulty === "hard") {
      const ratio = parseFloat(hardRatio);
      const numHard = Math.round(numQuestions * ratio);
      const numMedium = numQuestions - numHard;

      const hardCandidates = candidates.filter((r) => r.difficulty === "hard");
      const mediumCandidates = candidates.filter((r) => r.difficulty === "medium");

      const selectedHard = selectFromPool(hardCandidates, numHard);
      const selectedMedium = selectFromPool(mediumCandidates, numMedium);

      selected = [...selectedHard, ...selectedMedium];
    } else {
      const poolCandidates = candidates.filter((r) => r.difficulty === selectedDifficulty);
      selected = selectFromPool(poolCandidates, numQuestions);
    }

    if (selected.length === 0) {
      alert("No reactions found matching current criteria. Try selecting more types.");
      return;
    }

    // Final shuffle for mixed layout
    selected.sort(() => Math.random() - 0.5);

    setQuestions(selected);
    setViewMode("print");
    setUserAnswers({});
    setShowScore(false);
    setWorksheetDate("");
    setWorksheetId(generateWorksheetId());
  };

  const toggleTodayDate = () => {
    if (worksheetDate) {
      setWorksheetDate("");
    } else {
      const today = new Date();
      let dateString = "";
      if (locale.startsWith("zh")) {
        dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
      } else {
        dateString = today.toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
      setWorksheetDate(dateString);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUserCoefChange = (qIdx: number, coefIdx: number, value: string) => {
    const numVal = parseInt(value, 10);
    setUserAnswers((prev) => {
      const prevAnswers = prev[qIdx] ? [...prev[qIdx]] : [];
      while (prevAnswers.length <= coefIdx) {
        prevAnswers.push(0);
      }
      prevAnswers[coefIdx] = isNaN(numVal) ? 0 : numVal;
      return { ...prev, [qIdx]: prevAnswers };
    });
  };

  const isQuestionCorrect = (qIdx: number, expectedCoefficients: number[]): boolean => {
    const answers = userAnswers[qIdx];
    if (!answers) return false;
    return expectedCoefficients.every((coef, i) => answers[i] === coef);
  };

  const isCoefInputCorrect = (qIdx: number, coefIdx: number, expected: number): boolean => {
    const answers = userAnswers[qIdx];
    if (!answers) return false;
    return answers[coefIdx] === expected;
  };

  const renderFormulaJSX = (formula: string) => {
    const parts = formula.split(/(\d+)/);
    return (
      <span className="font-mono font-bold select-all">
        {parts.map((part, i) => {
          if (/^\d+$/.test(part)) {
            return (
              <sub key={i} className="text-[75%] bottom-[-0.25em]">
                {part}
              </sub>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const renderReactantsJSX = (
    side: string,
    termCoefficients: number[],
    termStartIndex: number,
    qIdx: number,
    reaction: Reaction
  ) => {
    return side.split(/\s*\+\s*/).map((term, index) => {
      const isFirst = index === 0;
      const cleanTerm = term.trim().replace(/^\d+/, ""); // strip coeff if any
      const coefIdx = termStartIndex + index;
      const expectedCoeff = termCoefficients[coefIdx];

      return (
        <span key={index} className="inline-flex items-center gap-1">
          {!isFirst && <span className="text-zinc-500 dark:text-zinc-400 mx-1 font-bold print:text-black">+</span>}
          {viewMode === "print" ? (
            <span className="inline-block w-8 border-b-2 border-zinc-400 dark:border-zinc-500 mr-1 text-center font-bold font-mono text-transparent print:border-black">
              __
            </span>
          ) : viewMode === "answer" ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold border-b border-dashed border-emerald-500 px-1 font-mono print:text-black print:border-black">
              {expectedCoeff}
            </span>
          ) : (
            // Practice Mode
            <input
              type="number"
              min="1"
              max="99"
              value={userAnswers[qIdx]?.[coefIdx] || ""}
              onChange={(e) => handleUserCoefChange(qIdx, coefIdx, e.target.value)}
              className={`coef-input w-8 h-6 text-center font-bold font-mono text-xs border rounded-md focus:outline-none transition-all print:hidden ${
                showScore
                  ? isCoefInputCorrect(qIdx, coefIdx, expectedCoeff)
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const inputs = document.querySelectorAll(".coef-input");
                  const currentIndex = Array.from(inputs).indexOf(e.currentTarget as any);
                  if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                    (inputs[currentIndex + 1] as HTMLElement).focus();
                  }
                }
              }}
            />
          )}
          {renderFormulaJSX(cleanTerm)}
        </span>
      );
    });
  };

  const renderQuestionJSX = (reaction: Reaction, qIdx: number) => {
    const [left, right] = reaction.unbalanced.split(/\s*->\s*/);
    const leftTermsCount = left.split(/\s*\+\s*/).length;
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-zinc-800 dark:text-zinc-200 print:text-black font-semibold text-sm sm:text-base select-all py-1">
        {renderReactantsJSX(left, reaction.coefficients, 0, qIdx, reaction)}
        <span className="text-zinc-400 font-bold mx-2 select-none print:text-black">→</span>
        {renderReactantsJSX(right, reaction.coefficients, leftTermsCount, qIdx, reaction)}
      </div>
    );
  };

  const getTypesSummary = (): string => {
    if (questions.length === 0) return "";
    const activeTypes = Object.keys(types).filter((k) => types[k as keyof typeof types]);
    return activeTypes
      .map((type) => t(type))
      .join(", ");
  };

  const getCorrectAnswersCount = (): number => {
    return questions.filter((q, i) => isQuestionCorrect(i, q.coefficients)).length;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Dynamic CSS Styling Inject */}
      <style dangerouslySetInnerHTML={{ __html: `
        .coef-input::-webkit-outer-spin-button,
        .coef-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .coef-input {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, footer, aside, .print\\:hidden {
            display: none !important;
          }
          body, html, main {
            background: white !important;
            color: black !important;
          }
          .worksheet-paper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            border: none !important;
            color: black !important;
            box-shadow: none !important;
          }
          .question-row {
            page-break-inside: avoid;
            break-inside: avoid;
            border-color: #cbd5e1 !important;
            background: transparent !important;
            color: black !important;
          }
        }
      ` }} />

      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl border border-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("title")}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls Panel */}
        <div className="lg:col-span-1 space-y-5 print:hidden">
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-md rounded-2xl p-5 space-y-5 shadow-sm">
            <div className="space-y-1 border-b border-zinc-200 dark:border-zinc-800/80 pb-2.5">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-pulse" />
                Worksheet Options
              </h3>
              <p className="text-[10px] leading-relaxed text-zinc-450 dark:text-zinc-500">
                Customize and generate chemistry worksheets for print or online practice.
              </p>
            </div>

            {/* Questions Number */}
            <div className="space-y-1.5">
              <span className="text-xs text-zinc-500 dark:text-zinc-455 font-semibold uppercase tracking-wider block">
                {t("numQuestions")}
              </span>
              <Select value={numQuestions.toString()} onValueChange={(val: string) => setNumQuestions(parseInt(val, 10))}>
                <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">{getLocalTranslation("q5", locale)}</SelectItem>
                  <SelectItem value="10">{getLocalTranslation("q10", locale)}</SelectItem>
                  <SelectItem value="15">{getLocalTranslation("q15", locale)}</SelectItem>
                  <SelectItem value="20">{getLocalTranslation("q20", locale)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <span className="text-xs text-zinc-500 dark:text-zinc-455 font-semibold uppercase tracking-wider block">
                {t("difficulty")}
              </span>
              <RadioGroup
                value={selectedDifficulty}
                onValueChange={(val: "easy" | "medium" | "hard") => setSelectedDifficulty(val)}
                className="grid grid-cols-3 gap-2"
              >
                <RadioGroupItem value="easy">{t("easy")}</RadioGroupItem>
                <RadioGroupItem value="medium">{t("medium")}</RadioGroupItem>
                <RadioGroupItem value="hard">{t("hard")}</RadioGroupItem>
              </RadioGroup>
            </div>

            {/* Hard level ratio selection (custom Radio Group) */}
            {selectedDifficulty === "hard" && (
              <div className="space-y-2 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                <span className="text-xs text-zinc-500 dark:text-zinc-455 font-semibold uppercase tracking-wider block">
                  {getLocalTranslation("hardRatioLabel", locale)}
                </span>
                <RadioGroup
                  value={hardRatio}
                  onValueChange={(val: string) => setHardRatio(val)}
                  className="grid grid-cols-2 gap-2"
                >
                  <RadioGroupItem value="1.0">
                    {getLocalTranslation("ratio100", locale)}
                  </RadioGroupItem>
                  <RadioGroupItem value="0.8">
                    {getLocalTranslation("ratio80", locale)}
                  </RadioGroupItem>
                  <RadioGroupItem value="0.5">
                    {getLocalTranslation("ratio50", locale)}
                  </RadioGroupItem>
                  <RadioGroupItem value="0.3">
                    {getLocalTranslation("ratio30", locale)}
                  </RadioGroupItem>
                </RadioGroup>
              </div>
            )}

            {/* Reaction Types Checklist */}
            <div className="space-y-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-455 font-semibold uppercase tracking-wider block">
                {t("reactionTypes")}
              </span>
              <div className="space-y-2.5 pt-1">
                {(Object.keys(types) as Array<keyof typeof types>).map((typeKey) => (
                  <div
                    key={typeKey}
                    className="flex items-start gap-2.5 text-zinc-755 dark:text-zinc-300 text-xs w-full text-left bg-zinc-50 hover:bg-zinc-100/70 dark:bg-zinc-950 dark:hover:bg-zinc-900 p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all select-none cursor-pointer"
                  >
                    <Checkbox
                      id={`type-${typeKey}`}
                      checked={types[typeKey]}
                      onCheckedChange={() => handleToggleType(typeKey)}
                      className="mt-0.5 shrink-0"
                    />
                    <label
                      htmlFor={`type-${typeKey}`}
                      className="flex flex-col cursor-pointer w-full"
                    >
                      <span className="font-semibold">{t(typeKey)}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 select-none">
                        {REACTION_TYPE_SUBTITLES[typeKey]}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-[0.98] text-xs"
              type="button"
            >
              {t("generate")}
            </button>

            {questions.length > 0 && (
              <button
                onClick={toggleTodayDate}
                className="w-full bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold py-2 px-4 rounded-xl transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
                type="button"
              >
                <Calendar className="w-4 h-4" />
                {getLocalTranslation("fillTodayBtn", locale)}
              </button>
            )}
          </div>
        </div>

        {/* Right: Printable Sheet Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Action tabs header */}
          {questions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 p-3 rounded-2xl print:hidden shadow-sm">
              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setViewMode("print");
                    setShowScore(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "print"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                  type="button"
                >
                  {t("print")}
                </button>
                <button
                  onClick={() => {
                    setViewMode("practice");
                    setShowScore(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "practice"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                  type="button"
                >
                  {t("practice")}
                </button>
                <button
                  onClick={() => {
                    setViewMode("answer");
                    setShowScore(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "answer"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                  type="button"
                >
                  {t("answerKey")}
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 text-white bg-blue-500 hover:bg-blue-600 px-4 py-1.5 rounded-xl text-xs transition-all font-semibold active:scale-95 shadow-md shadow-blue-500/10"
                type="button"
              >
                <Printer className="w-4 h-4" />
                Print Worksheet
              </button>
            </div>
          )}

          {/* Actual Worksheet Document */}
          <div className="worksheet-paper bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 min-h-[600px] flex flex-col justify-between print:bg-white print:border-none print:text-black print:p-0 print:shadow-none shadow-sm">
            {questions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 h-[500px]">
                <FileText className="w-12 h-12 text-zinc-350 dark:text-zinc-750 mb-3" />
                <h4 className="text-sm font-semibold text-zinc-650 dark:text-zinc-400">No Worksheet Generated</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
                  {t("placeholder")}
                </p>
              </div>
            ) : (
              <div className="space-y-8 print:text-black">
                {/* Summary bar for online info */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-400 flex items-center gap-2 print:hidden select-none">
                  <span>{questions.length} {getLocalTranslation("questionsCount", locale)}</span>
                  <span className="opacity-40">•</span>
                  <span>{t(selectedDifficulty)}</span>
                  <span className="opacity-40">•</span>
                  <span className="opacity-90">{getTypesSummary()}</span>
                </div>

                {/* School Header */}
                <div className="border-b-2 border-zinc-800 dark:border-zinc-200 pb-4 print:border-black space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white print:text-black">
                      {viewMode === "print"
                        ? getLocalTranslation("worksheetTitlePrint", locale)
                        : viewMode === "answer"
                        ? getLocalTranslation("worksheetTitleAnswerKey", locale)
                        : getLocalTranslation("worksheetTitlePractice", locale)}
                    </h2>
                    <span className="worksheet-id-badge text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono print:text-black print:border-black">
                      #{worksheetId}
                    </span>
                  </div>

                  {viewMode !== "practice" && (
                    <div className="header-fields flex flex-wrap gap-x-8 gap-y-3 font-mono text-zinc-700 dark:text-zinc-350 print:text-black select-none">
                      <div className="field-group flex items-baseline gap-1.5">
                        <span className="field-label text-xs font-bold text-zinc-500 dark:text-zinc-450 print:text-black">
                          {getLocalTranslation("name", locale)}:
                        </span>
                        <span className="field-line inline-block w-40 border-b border-zinc-800 dark:border-zinc-250 print:border-black"></span>
                      </div>
                      <div className="field-group flex items-baseline gap-1.5">
                        <span className="field-label text-xs font-bold text-zinc-500 dark:text-zinc-455 print:text-black">
                          {getLocalTranslation("dateLabel", locale)}:
                        </span>
                        {worksheetDate ? (
                          <span className="field-value text-xs font-bold text-zinc-800 dark:text-zinc-150 print:text-black">
                            {worksheetDate}
                          </span>
                        ) : (
                          <span className="field-line inline-block w-40 border-b border-zinc-800 dark:border-zinc-250 print:border-black"></span>
                        )}
                      </div>
                      <div className="field-group flex items-baseline gap-1.5">
                        <span className="field-label text-xs font-bold text-zinc-500 dark:text-zinc-455 print:text-black">
                          {getLocalTranslation("scoreLabel", locale)}:
                        </span>
                        <span className="field-line inline-block w-12 border-b border-zinc-800 dark:border-zinc-250 print:border-black"></span>
                        <span className="score-total text-xs text-zinc-500 dark:text-zinc-450 print:text-black">
                          /{questions.length}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-455 font-mono mt-1 print:text-black select-none">
                    Difficulty: {t(selectedDifficulty).toUpperCase()}
                  </div>
                </div>

                {/* Instructions */}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal italic print:text-black select-none">
                  {viewMode === "practice"
                    ? getLocalTranslation("instructionsPractice", locale)
                    : getLocalTranslation("instructionsPrint", locale)}
                </p>

                {/* Question List */}
                <div className="questions-grid flex flex-col gap-3.5 print:gap-4 print:text-black">
                  {questions.map((q, idx) => {
                    const isCorrect = showScore && isQuestionCorrect(idx, q.coefficients);
                    return (
                      <div
                        key={idx}
                        className={`question-row transition-all rounded-xl p-3 border pl-2.5 border-zinc-200 dark:border-zinc-850 flex items-center justify-between flex-wrap gap-3 ${
                          showScore && viewMode === "practice"
                            ? isCorrect
                              ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10"
                              : "border-red-500 bg-red-500/5 dark:bg-red-950/10"
                            : viewMode === "answer"
                            ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10"
                            : "bg-zinc-50/45 dark:bg-zinc-950/10"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-550 print:text-black select-none w-5">
                            {idx + 1}.
                          </span>
                          {renderQuestionJSX(q, idx)}
                        </span>

                        {/* Interactive Row Status Icon */}
                        {viewMode === "practice" && showScore && (
                          <span className="text-lg font-bold ml-auto sm:ml-0 mr-1 select-none">
                            {isCorrect ? (
                              <span className="text-emerald-500 dark:text-emerald-400">✓</span>
                            ) : (
                              <span className="text-red-500 dark:text-red-400 font-mono font-black">✗</span>
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Practice Action and Score Bar */}
                {viewMode === "practice" && (
                  <div className="flex items-center gap-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-4 mt-8 print:hidden select-none">
                    <button
                      onClick={() => setShowScore(true)}
                      className="flex items-center gap-1.5 text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-5 py-2 rounded-xl text-xs transition-all font-semibold active:scale-95 shadow-md shadow-blue-500/10"
                      type="button"
                    >
                      <CheckSquare className="w-4 h-4" />
                      {getLocalTranslation("checkBtn", locale)}
                    </button>

                    {showScore && (
                      <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold">
                        <span className="text-zinc-500 dark:text-zinc-400">Score:</span>
                        <span
                          className={`text-sm ${
                            getCorrectAnswersCount() === questions.length
                              ? "text-emerald-500 dark:text-emerald-400"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {getCorrectAnswersCount()} / {questions.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer notes */}
                <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-4 mt-8 flex justify-between items-center text-[10px] text-zinc-500 dark:text-zinc-500 print:text-black print:border-black select-none">
                  <span>© Kimi Chemistry Tools</span>
                  <span>{t("trustText")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
