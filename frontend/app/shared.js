// 共享常量与工具函数(多页面共用)

export const diffStyle = {
  高: "bg-[#ffebee] text-[#f44336]",
  中: "bg-[#fff8e1] text-[#ffa000]",
  低: "bg-[#e8f5e9] text-[#4caf50]",
};
export const TONES = ["温暖朋友", "严格教练", "幽默伙伴"];

export const FEEDBACK = {
  温暖朋友: {
    done: ["做到啦,很棒!今天又往前一步。", "完成一个就很厉害了,继续!", "稳稳的,给自己点个赞。"],
    miss: ["辛苦了,先休息,明天咱们把简单的先做。", "没关系,加班太累很正常,保住状态最重要。", "别自责,明天重新来过就好~"],
  },
  严格教练: {
    done: ["完成是应该的,别骄傲,明天继续保持。", "达标,但标准还能再提。", "算你过关,别松懈。"],
    miss: ["理由记下了,但连续性不能断,明天补上。", "没做完就是没做完,明天补回来。", "少找借口,明天先做这一件。"],
  },
  幽默伙伴: {
    done: ["恭喜你又战胜了拖延症(本次)。", "任务:已拿捏。沙发:已失宠。", "今天你是「自律」本人。"],
    miss: ["加班/累赢了,任务输了。明天扳回来。", "任务已原谅你,但记小本本了。", "没事,你只是给明天攒了波大的。"],
  },
};

export const PRESETS = [
  { label: "顺利", done: true, quality: 5, note: "顺利完成", cls: "bg-[#4caf50]" },
  { label: "勉强", done: true, quality: 3, note: "勉强完成", cls: "bg-[#ffc107]" },
  { label: "加班", done: false, quality: 2, note: "加班没做", cls: "bg-[#d65645]" },
  { label: "太累", done: false, quality: 1, note: "太累了", cls: "bg-[#77736b]" },
];

// —— 日期工具(全部用 UTC,避免时区把"加一天"吃掉)——
export function isoToday() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function addDay(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function dayDiff(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// —— 陪伴小人对话 ——
export function companionGreeting(tone, name, dayN) {
  const g = {
    温暖朋友: `Hi ${name},第 ${dayN} 天啦,今天想从哪件小事开始?`,
    严格教练: `${name},第 ${dayN} 天。计划列了吗?现在就开始。`,
    幽默伙伴: `哟 ${name},第 ${dayN} 天,你的任务已经等不及了。`,
  };
  return g[tone] || g["温暖朋友"];
}

export function companionReply(text, tone, dash) {
  const dataLine = dash?.completion_rate != null
    ? `你最近完成率 ${(dash.completion_rate * 100) | 0}%${dash.streak ? `,已连续 ${dash.streak} 天` : ""},`
    : "";
  if (/累|不想|放弃|难|没空|加班/.test(text || "")) {
    const rest = {
      温暖朋友: "累了就歇会儿,明天咱们把简单的先做了,不丢事。",
      严格教练: "累可以,但今天至少做一件,保持手感。",
      幽默伙伴: "懂,摆烂也是一种策略——但只准摆一小会儿。",
    };
    return rest[tone] || rest["温暖朋友"];
  }
  const pool = {
    温暖朋友: [
      `${dataLine}继续保持就很棒,今天先挑一个最简单的开始~`,
      "我在呢,别给自己太大压力,一步一步来。",
      "完成一个就算赢,我一直在陪着你。",
    ],
    严格教练: [
      `${dataLine}别满足,今天至少把核心任务做完。`,
      "借口我听了,但连续性不能断,现在就开始。",
      "执行力是练出来的,别拖,先做 5 分钟。",
    ],
    幽默伙伴: [
      `${dataLine}这进度,拖延症看了都直呼内行(褒义)。`,
      "我在,要不要我假装监督你?很凶那种。",
      "任务在排队等你,它们说想你了。",
    ],
  };
  return pick(pool[tone] || pool["温暖朋友"]);
}
