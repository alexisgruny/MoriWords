import { describe, expect, it } from "vitest";

import { decodeSubtitleFile, parseSubtitles } from "./parse-subtitles";

const SRT = `1
00:00:01,000 --> 00:00:03,000
<i>おはよう！</i>

2
00:00:03,500 --> 00:00:05,000
今日も一緒に頑張ろう。
Let's do our best today.

3
00:00:05,500 --> 00:00:06,000
今日も一緒に頑張ろう。

4
00:00:07,000 --> 00:00:08,000
♪～
`;

const VTT = `WEBVTT

NOTE généré par un outil

00:01.000 --> 00:03.000 align:start
{\\an8}待って！
二人とも

00:03.500 --> 00:05.000
どこに行くの？
`;

const ASS = `[Script Info]
Title: Épisode 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,{\\i1}絶対に、あきらめない！{\\i0}
Dialogue: 0,0:00:03.00,0:00:05.00,Default,Rei,0,0,0,,そうだね\\N行こう
Comment: 0,0:00:05.00,0:00:06.00,Default,,0,0,0,,コメントは無視
`;

describe("import de sous-titres", () => {
  it("extracts Japanese lines from .srt, without numbers, timecodes, tags, translations or repeats", () => {
    expect(parseSubtitles(SRT, 10_000)).toEqual({
      text: "おはよう！\n今日も一緒に頑張ろう。",
      lineCount: 2,
      truncated: false,
    });
  });

  it("reads .vtt, skipping the header, notes and cue settings", () => {
    expect(parseSubtitles(VTT, 10_000).text).toBe("待って！\n二人とも\nどこに行くの？");
  });

  it("reads .ass dialogue lines only, keeping commas in the text and splitting on \\N", () => {
    expect(parseSubtitles(ASS, 10_000).text).toBe("絶対に、あきらめない！\nそうだね\n行こう");
  });

  it("stops at the analysis limit without cutting a line in half", () => {
    const parsed = parseSubtitles(SRT, 10);
    expect(parsed).toEqual({ text: "おはよう！", lineCount: 1, truncated: true });
  });

  it("falls back to Shift-JIS when the file is not UTF-8", () => {
    // « こんにちは » en Shift-JIS.
    const sjis = new Uint8Array([0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd]);
    expect(decodeSubtitleFile(sjis.buffer)).toBe("こんにちは");
    expect(decodeSubtitleFile(new TextEncoder().encode("こんにちは").buffer as ArrayBuffer)).toBe("こんにちは");
  });
});
