// 模拟测试 segmentAssistantContentCore 的行为

function segmentParagraphsForActivity(text) {
  const ACTIVITY_PARAGRAPH =
    /^(Reading|Writing|Searching|Running|Executing|Checking|Looking|Found|Created|Updated|Modified|Deleted|Error|Warning)/i;
  const parts = text.split(/\n{2,}/);
  const out = [];
  for (const p of parts) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    if (lines.length === 1 && ACTIVITY_PARAGRAPH.test(trimmed)) {
      out.push({ status: "info", text: trimmed, type: "activity" });
    } else {
      out.push({ text: p, type: "markdown" });
    }
  }
  return out;
}

function segmentAssistantContentCore(content) {
  const out = [];
  let i = 0;
  const n = content.length;

  const pushText = (slice) => {
    if (!slice) return;
    out.push(...segmentParagraphsForActivity(slice));
  };

  while (i < n) {
    const fence = content.indexOf("```", i);
    if (fence === -1) {
      pushText(content.slice(i));
      break;
    }
    pushText(content.slice(i, fence));
    const langEnd = content.indexOf("\n", fence + 3);
    if (langEnd === -1) {
      const afterFence = content.slice(fence + 3);
      if (/^[\w+#.+-]*$/.test(afterFence)) {
        out.push({ body: "", lang: afterFence, type: "streaming_code" });
      } else {
        out.push({ text: content.slice(fence), type: "markdown" });
      }
      break;
    }
    const lang = content.slice(fence + 3, langEnd).trim();
    const close = content.indexOf("```", langEnd + 1);
    if (close === -1) {
      out.push({
        body: content.slice(langEnd + 1),
        lang,
        type: "streaming_code",
      });
      break;
    }
    const body = content.slice(langEnd + 1, close);
    out.push({ text: content.slice(fence, close + 3), type: "markdown" });
    i = close + 3;
  }

  return out;
}

// 测试各种流式状态
const tests = [
  { content: "```", label: "1. 只有 ``` (刚出现围栏)" },
  { content: "```python", label: "2. ```python (有语言标记，无换行)" },
  { content: "```python\n", label: "3. ```python\\n (有换行，无代码)" },
  {
    content: "```python\ndef hello():\n",
    label: "4. ```python\\ndef hello():\\n (有部分代码)",
  },
  {
    content: '```python\ndef hello():\n    print("hello")\n```',
    label: "5. 完整代码块",
  },
  {
    content: "这是说明\n\n```python\ndef hello():\n",
    label: "6. 前置文字 + 代码块（流式中）",
  },
  {
    content: '这是说明\n\n```python\ndef hello():\n    print("hello")\n```',
    label: "7. 前置文字 + 完整代码块",
  },
  {
    content: "这是说明\n```python\ndef hello():\n",
    label: "8. 前置文字（单换行）+ 代码块（流式中）",
  },
  {
    content: "``` python\ndef hello():\n",
    label: "9. ``` 后有空格 (``` python)",
  },
];

for (const { label, content } of tests) {
  const segs = segmentAssistantContentCore(content);
  const types = segs.map((s) => s.type);
  const hasStreamingCode = types.includes("streaming_code");
  console.log(`${label}`);
  console.log(`  Segments: [${types.join(", ")}]`);
  console.log(`  Has streaming_code: ${hasStreamingCode}`);
  if (!hasStreamingCode) {
    console.log("  *** PROBLEM: No streaming_code generated! ***");
  }
  console.log();
}
